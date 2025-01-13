import { type TypedDocumentNode, createRequest } from "@urql/core";
import { makeClient } from "eq-lib";

import { sleep } from "bun";
import { print } from "graphql";
import { ALL_QUERIES } from "./collection-queries";
import { getFirstFieldName, getFirstOperationName } from "./lib/helpers";
import { hasSnapshot, makeSnapshotPath, persistSnapshot } from "./lib/snapshots";
import { injectSubgraphBlockHeightArgument } from "./lib/subgraph-ops";
import { Indexer } from "./lib/types";
import { PonderMeta } from "./ponder-meta";

const makeSubgraphUrl = (apiKey: string) =>
	`https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH`;

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
			if (items.length < first) {
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

async function snapshot(indexer: Indexer, blockheight: number) {
	for (const query of ALL_QUERIES) {
		await paginate(indexer, query, blockheight);
		// TODO: better retry/ratelimiting logic
		await sleep(500);
	}
}

await snapshot(Indexer.Ponder, 4_000_000);
