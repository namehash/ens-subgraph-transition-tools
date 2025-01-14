import { Indexer } from "@/lib/types";

import { parse } from "node:path";
import { makeSnapshotDirectoryPath, makeSnapshotPath } from "@/lib/snapshots";
import { Glob } from "bun";
import { diffJson } from "eq-lib";

export async function diffCommand(blockheight: number) {
	const subgraphSnapshotDirectory = makeSnapshotDirectoryPath({
		blockheight,
		indexer: Indexer.Subgraph,
	});

	const subgraphSnapshots = new Glob("*.json").scan(subgraphSnapshotDirectory);

	for await (const snapshotFileName of subgraphSnapshots) {
		const operationKey = parse(snapshotFileName).name;
		// subgraph snapshot guaranteed to exist
		const subgraphSnapshot = await Bun.file(
			makeSnapshotPath({
				blockheight,
				indexer: Indexer.Subgraph,
				operationKey,
			}),
		).json();

		// ponder snapshot not guaranteed
		const ponderSnapshotPath = makeSnapshotPath({
			blockheight,
			indexer: Indexer.Ponder,
			operationKey,
		});

		const exists = await Bun.file(ponderSnapshotPath).exists();
		if (!exists) {
			// throw new Error(`Ponder(${blockheight}) does not have '${operationKey}.json'`);
			console.error(`Ponder(${blockheight}) does not have '${operationKey}.json'`);
			continue;
		}

		const ponderSnapshot = await Bun.file(ponderSnapshotPath).json();

		// they both exist, let's diff them
		const result = await diffJson(subgraphSnapshot, ponderSnapshot);

		// they're equal, huzzah
		if (result.equal) continue;

		// otherwise, print and throw
		console.error(`Difference Found in operationKey ${operationKey}.json`);
		console.error(JSON.stringify(result, null, 2));
		process.exit(1);
	}

	console.log(`Diff(${blockheight}) — snapshots are identical.`);
}
