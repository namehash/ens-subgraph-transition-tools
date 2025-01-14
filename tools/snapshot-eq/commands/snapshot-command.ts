import { type TypedDocumentNode, createRequest } from "@urql/core";
import { makeClient } from "eq-lib";

import { getFirstFieldName, getFirstOperationName, makeSubgraphUrl } from "@/lib/helpers";
import { hasSnapshot, makeSnapshotPath, persistSnapshot } from "@/lib/snapshots";
import { print } from "graphql";

import { injectSubgraphBlockHeightArgument } from "@/lib/subgraph-ops";
import { Indexer } from "@/lib/types";
import { AccountsQuery } from "@/queries/AccountsQuery";
import { DomainsQuery } from "@/queries/DomainsQuery";
import { PonderMeta } from "@/queries/PonderMeta";
import { RegistrationsQuery } from "@/queries/RegistrationsQuery";
import { ResolversQuery } from "@/queries/ResolversQuery";
import { WrappedDomainsQuery } from "@/queries/WrappedDomainsQuery";

const BATCH_SIZE = 1000;
async function paginate(indexer: Indexer, query: TypedDocumentNode, blockheight: number) {
	const url =
		indexer === Indexer.Ponder
			? // biome-ignore lint/style/noNonNullAssertion: convenience
				Bun.env.PONDER_API_URL!
			: // biome-ignore lint/style/noNonNullAssertion: convenience
				makeSubgraphUrl(Bun.env.SUBGRAPH_API_KEY!);

	const client = makeClient(url);

	// if ponder, confirm that indexer is at the specific blockneight and is ready
	if (indexer === Indexer.Ponder) {
		const { data } = await client.query(PonderMeta);
		// NOTE: hardcodes mainnet
		const {
			ready,
			block: { number: ponderBlockheight },
		} = data._meta.status.mainnet;

		if (!ready) {
			throw new Error("Ponder is not _meta.status.mainnet.ready");
		}

		if (ponderBlockheight !== blockheight) {
			throw new Error(`Ponder is at ${ponderBlockheight}, ${blockheight} requeted.`);
		}
	}

	const operationName = getFirstOperationName(query);
	const fieldName = getFirstFieldName(query);
	if (!fieldName) {
		console.log(print(query));
		throw new Error("Unexpected collection query format, unable to extract fieldName");
	}

	let i = 0;
	while (true) {
		const first = BATCH_SIZE;
		const skip = i * BATCH_SIZE;

		// NOTE: always derive the operation key from the un-altered query
		const operationKey = createRequest(query, { first, skip }).key.toString();

		const document =
			indexer === Indexer.Ponder //
				? query // ponder uses query as-is
				: injectSubgraphBlockHeightArgument(query, blockheight); // inject blockheight if subgraph

		const snapshotPath = makeSnapshotPath({
			blockheight,
			indexer,
			operationKey,
		});

		// skip any requests that have already been fetched & persisted
		const _hasSnapshot = await hasSnapshot(snapshotPath);
		if (_hasSnapshot) {
			console.log(`${operationName} (${skip}, ${skip + first}] — cached, continuing...`);
		} else {
			console.log(`${operationName} (${skip}, ${skip + first}] — fetching...`);

			const { data, error } = await client.query(document, { first, skip });

			// if we recieved an error, surface and bail
			if (error) {
				console.log(`URL: ${url}`);
				console.log(print(document));
				throw error;
			}

			const items = data[fieldName] as unknown[];

			// if we receive 0 items, we are done with this collection
			if (items.length === 0) {
				console.log(`${operationName} — done snapshotting `);
				return;
			}

			// otherwise we got some data, persist result and continue
			await persistSnapshot(snapshotPath, JSON.stringify(data));
			console.log(`  ↳ persisted ${first} records`);
		}

		i++;
	}
}

const ALL_QUERIES = [
	DomainsQuery,
	AccountsQuery,
	ResolversQuery,
	RegistrationsQuery,
	WrappedDomainsQuery,
];

export async function snapshotCommand(blockheight: number, indexer: Indexer) {
	for (const query of ALL_QUERIES) {
		await paginate(indexer, query, blockheight);
	}

	console.log(`↳ Snapshot(${blockheight}, ${indexer}) done`);
}
