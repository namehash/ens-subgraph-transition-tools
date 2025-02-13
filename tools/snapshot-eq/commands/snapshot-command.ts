import { type Client, type TypedDocumentNode, createRequest } from "@urql/core";
import { makeClient } from "eq-lib";
import PQueue from "p-queue";
import ProgressBar from "progress";

import {
	getEnsnodeUrl,
	getFirstOperationName,
	getSubgraphApiKey,
	makeSubgraphUrl,
} from "@/lib/helpers";
import { hasSnapshot, makeSnapshotPath, persistSnapshot } from "@/lib/snapshots";
import { print } from "graphql";

import { getTotalCount } from "@/lib/get-total-count";
import { injectSubgraphBlockHeightArgument } from "@/lib/subgraph-ops";
import { Indexer } from "@/lib/types";
import { AccountsQuery } from "@/queries/AccountsQuery";
import { DomainsQuery } from "@/queries/DomainsQuery";
import { PonderMeta } from "@/queries/PonderMeta";
import { RegistrationsQuery } from "@/queries/RegistrationsQuery";
import { ResolversQuery } from "@/queries/ResolversQuery";
import {
	AccountsTotalCountQuery,
	DomainsTotalCountQuery,
	RegistrationsTotalCountQuery,
	ResolversTotalCountQuery,
	WrappedDomainsTotalCountQuery,
} from "@/queries/TotalCountQueries";
import { WrappedDomainsQuery } from "@/queries/WrappedDomainsQuery";

// subgraph (& ponder) have hard limit of 1000 for plural field `first`
const BATCH_SIZE = 1000;

type PageVariables = { first: number; skip: number };

async function fetchItems(client: Client, document: TypedDocumentNode, variables: PageVariables) {
	const { data, error } = await client.query(document, variables);

	// if we recieved an error or no data, surface and bail
	if (error || !data) {
		console.error(JSON.stringify(variables));
		console.error(print(document));
		throw error || new Error("Received empty data");
	}

	return data.items as unknown[];
}

async function idempotentFetchItems(
	indexer: Indexer,
	client: Client,
	query: TypedDocumentNode,
	variables: PageVariables,
	blockheight: number,
) {
	// NOTE: always derive the operation key from the un-altered query
	const operationKey = createRequest(query, variables).key.toString();

	const snapshotPath = makeSnapshotPath({ blockheight, indexer, operationKey });

	// skip any requests that have already been fetched & persisted
	const _hasSnapshot = await hasSnapshot(snapshotPath);
	if (_hasSnapshot) return;

	const documentWithBlockheight =
		indexer === Indexer.Subgraph //
			? injectSubgraphBlockHeightArgument(query, blockheight) // inject blockheight if subgraph
			: query; // ponder uses query as-is

	// fetch items
	const items = await fetchItems(client, documentWithBlockheight, variables);

	// persist snapshot
	await persistSnapshot(snapshotPath, JSON.stringify(items));
}

async function paginateParallel(
	client: Client,
	indexer: Indexer,
	query: TypedDocumentNode,
	blockheight: number,
	numRecords: number,
) {
	// cannot paginate over 0 records
	if (numRecords === 0) return;

	// TODO: integrate AbortController (?)
	const queue = new PQueue({
		// subgraph is distributed, so parallelize, ponder is single-instance bound by postgres
		concurrency: indexer === Indexer.Subgraph ? 10 : 1,
	});

	const totalPages = Math.ceil(numRecords / BATCH_SIZE);
	const offsets = Array.from({ length: totalPages }, (_, i) => i * BATCH_SIZE);

	const operationName = getFirstOperationName(query);
	const bar = new ProgressBar(
		`${operationName} [:bar] :current/:total items (:percent) - :rate items/sec - :etas remaining`,
		{
			complete: "=",
			incomplete: " ",
			width: 40,
			total: numRecords,
		},
	);

	bar.tick(0);

	// add all pages to queue and await
	await queue.addAll(
		offsets.map((offset) => async () => {
			await idempotentFetchItems(
				indexer,
				client,
				query,
				{ first: BATCH_SIZE, skip: offset },
				blockheight,
			);
			bar.tick(BATCH_SIZE);
		}),
	);
}

const ALL_QUERIES: [TypedDocumentNode, TypedDocumentNode][] = [
	[DomainsQuery, DomainsTotalCountQuery],
	[AccountsQuery, AccountsTotalCountQuery],
	[ResolversQuery, ResolversTotalCountQuery],
	[RegistrationsQuery, RegistrationsTotalCountQuery],
	[WrappedDomainsQuery, WrappedDomainsTotalCountQuery],
];

export async function snapshotCommand(blockheight: number, indexer: Indexer) {
	const url =
		indexer === Indexer.Ponder
			? `${getEnsnodeUrl()}/subgraph`
			: makeSubgraphUrl(getSubgraphApiKey());

	// if ponder, confirm that indexer is at the specific blockneight and is ready
	if (indexer === Indexer.Ponder) {
		const ponderApiClient = makeClient(getEnsnodeUrl());
		const { data } = await ponderApiClient.query(PonderMeta);
		// NOTE: hardcodes mainnet
		const {
			ready,
			block: { number: ponderBlockheight },
		} = data._meta.status["1"];

		if (!ready) {
			throw new Error("Ponder is not _meta.status.mainnet.ready");
		}

		if (ponderBlockheight !== blockheight) {
			throw new Error(`Ponder is at ${ponderBlockheight}, ${blockheight} requeted.`);
		}
	}

	const client = makeClient(url);

	for (const [document, totalCountDocument] of ALL_QUERIES) {
		const operationName = getFirstOperationName(document);

		console.log(`TotalCount(${operationName})`);
		const totalCountDocumentWithBlockheight =
			indexer === Indexer.Subgraph //
				? injectSubgraphBlockHeightArgument(totalCountDocument, blockheight) // inject blockheight if subgraph
				: totalCountDocument; // ponder uses query as-is

		const totalRecordCount = await getTotalCount({
			fetchPage: async (skip) => {
				const startTime = performance.now();
				const items = await fetchItems(client, totalCountDocumentWithBlockheight, {
					first: BATCH_SIZE,
					skip,
				});
				const requestDuration = (performance.now() - startTime) / 1000;

				console.log(
					`  ↳ saw ${items.length} records at ${skip} offset (${requestDuration.toFixed(4)}s)`,
				);

				return items;
			},
			batchSize: BATCH_SIZE,
			startSize: 10_000_000,
		});
		console.log(`TotalCount(${operationName}) — ${totalRecordCount}`);

		await paginateParallel(client, indexer, document, blockheight, totalRecordCount);
		console.log("\n");
	}

	console.log(`↳ Snapshot(${blockheight}, ${indexer}) done`);
}
