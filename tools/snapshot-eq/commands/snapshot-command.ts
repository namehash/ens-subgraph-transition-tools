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

import { clusterPonderSchema } from "@/lib/cluster-db";
import { getTotalCount } from "@/lib/get-total-count";
import { injectSubgraphBlockHeightArgument } from "@/lib/subgraph-ops";
import { Indexer } from "@/lib/types";
import { waitForPonderReady } from "@/lib/wait-for-ready";
import { ALL_QUERIES } from "@/queries";
import type { ENSNamespaceId } from "@ensnode/datasources";

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

async function fetchItemsAtBlockheight(
	indexer: Indexer,
	client: Client,
	document: TypedDocumentNode,
	variables: PageVariables,
	blockheight: number,
) {
	const documentWithBlockheight =
		indexer === Indexer.Subgraph //
			? injectSubgraphBlockHeightArgument(document, blockheight) // inject blockheight if subgraph
			: document; // ponder uses query as-is

	// fetch items
	return await fetchItems(client, documentWithBlockheight, variables);
}

async function paginateParallel(
	client: Client,
	indexer: Indexer,
	query: TypedDocumentNode,
	namespace: ENSNamespaceId,
	blockheight: number,
	numRecords: number,
) {
	// cannot paginate over 0 records
	if (numRecords === 0) return;

	const operationName = getFirstOperationName(query);

	// TODO: integrate AbortController (?)
	const queue = new PQueue({
		// subgraph is distributed, so parallelize, ponder is single-instance bound by postgres
		concurrency: indexer === Indexer.Subgraph ? 10 : 1,
	});

	const totalPages = Math.ceil(numRecords / BATCH_SIZE);

	// construct set of page descriptors
	const pages = Array.from({ length: totalPages }, (_, i) => i * BATCH_SIZE) //
		.map((offset) => {
			const variables = { first: BATCH_SIZE, skip: offset };
			// NOTE: always derive the operation key from the un-altered query
			const operationKey = createRequest(query, variables).key.toString();

			return {
				variables,
				operationKey,
				snapshotPath: makeSnapshotPath({
					namespace,
					blockheight,
					indexer,
					operationName,
					offset,
					operationKey,
				}),
			};
		});

	// fetch snapshot presence on disk
	const isPagePersisted = await Promise.all(
		pages.map(({ snapshotPath }) => hasSnapshot(snapshotPath)),
	);

	// skip any requests that have already been fetched & persisted
	const pagesToFetch = pages.filter((_, i) => !isPagePersisted[i]);

	const skippedPagesCount = pages.length - pagesToFetch.length;

	if (skippedPagesCount) console.log(`Skipping ${skippedPagesCount} persisted pages.`);

	const bar = new ProgressBar(
		`${operationName} [:bar] :current/:total items (:percent) - :rate items/sec - :etas remaining`,
		{
			complete: "=",
			incomplete: " ",
			width: 40,
			total: pagesToFetch.length * BATCH_SIZE,
		},
	);

	// add all pages to queue and await
	await queue.addAll(
		pagesToFetch.map((page) => async () => {
			// fetch items at blockheight
			const items = await fetchItemsAtBlockheight(
				indexer,
				client,
				query,
				page.variables,
				blockheight,
			);

			// persist snapshot
			await persistSnapshot(
				page.snapshotPath,
				JSON.stringify({
					operationName,
					operationKey: page.operationKey,
					variables: page.variables,
					items,
				}),
			);

			// update progress by batch
			bar.tick(BATCH_SIZE);
		}),
	);
}

export async function snapshotCommand(
	namespace: ENSNamespaceId,
	blockheight: number,
	indexer: Indexer,
) {
	const url =
		indexer === Indexer.ENSNode
			? `${getEnsnodeUrl()}/subgraph`
			: makeSubgraphUrl(namespace, getSubgraphApiKey());

	// if ponder, confirm that indexer is at the specific blockneight and is ready
	if (indexer === Indexer.ENSNode) {
		// select ponder network id by selected namespace chain
		const networkId = { sepolia: "11155111", holesky: "17000" }[namespace as string] || "1";
		await waitForPonderReady(networkId, blockheight);

		// cluster if possible
		await clusterPonderSchema();
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

		await paginateParallel(client, indexer, document, namespace, blockheight, totalRecordCount);
		console.log("\n");
	}

	console.log(`↳ Snapshot(${blockheight}, ${indexer}) done`);
}
