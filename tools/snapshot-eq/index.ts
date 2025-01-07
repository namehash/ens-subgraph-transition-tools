import { type TypedDocumentNode, createRequest } from "@urql/core";
import { makeClient } from "eq-lib";

import { sleep } from "bun";
import { print } from "graphql";
import { ALL_QUERIES } from "./collection-queries";
import { hasSnapshot, makeSnapshotPath, persistSnapshot } from "./lib/snapshots";
import { injectSubgraphBlockHeightArgument } from "./lib/subgraph-ops";
import { Indexer } from "./lib/types";

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

	let i = 0;
	while (true) {
		const first = BATCH_SIZE;
		const skip = i * BATCH_SIZE;

		// NOTE: always derive the operation key from the un-altered query
		const operationKey = createRequest(query, { first, skip }).key.toString();

		// if querying the subgraph, inject the blockheight argument into every query
		const document =
			indexer === Indexer.Ponder ? query : injectSubgraphBlockHeightArgument(query, blockheight);
		const request = createRequest(document, { first, skip });

		const snapshotPath = makeSnapshotPath({
			blockheight,
			indexer,
			operationKey,
		});

		// skip any requests that have already been fetched & persisted
		const _hasSnapshot = await hasSnapshot(snapshotPath);
		if (_hasSnapshot) {
			console.log(`(${skip}, ${skip + first}] — cached, continuing...`);
		} else {
			console.log(`(${skip}, ${skip + first}] — fetching...`);

			const { data, error } = await client.executeQuery(request);
			if (error) {
				console.log(`URL: ${url}`);
				console.log(print(document));
				throw error;
			}
			console.log(`  ↳ fetched ${first} records`);

			// TODO: get collection field, get length of response, break if < `first`

			await persistSnapshot(snapshotPath, JSON.stringify(data));
		}

		i++;
		break;
	}
}

async function snapshot(indexer: Indexer, blockheight: number) {
	for (const query of ALL_QUERIES) {
		await paginate(indexer, query, blockheight);
		// TODO: better retry/ratelimiting logic
		await sleep(500);
	}
}

await snapshot(Indexer.Subgraph, 12_000_000);
process.exit(0);
