import { Indexer } from "@/lib/types";

import { parse } from "node:path";
import { makeSnapshotDirectoryPath, makeSnapshotPath } from "@/lib/snapshots";
import { Glob } from "bun";
import { diffJson } from "eq-lib";

// helpful to ignore specific operationKeys to progress the diff
const IGNORE_OPERATION_KEYS: string[] = [];

function filterResultsBy(result: ReturnType<typeof diffJson>, match: RegExp) {
	const filtered = Object.fromEntries(
		Object.entries(result.diffs).filter(([path]) => path.match(match) === null),
	);
	const equal = Object.keys(filtered).length === 0;

	return {
		...result,
		equal,
		diffs: filtered,
	};
}

export async function diffCommand(blockheight: number) {
	const subgraphSnapshotDirectory = makeSnapshotDirectoryPath({
		blockheight,
		indexer: Indexer.Subgraph,
	});

	const subgraphSnapshots = new Glob("*.json").scan(subgraphSnapshotDirectory);

	for await (const snapshotFileName of subgraphSnapshots) {
		const operationKey = parse(snapshotFileName).name;

		if (IGNORE_OPERATION_KEYS.includes(operationKey)) continue;

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
		if (result.equal) continue;

		const filtered = result;
		// const filtered = filterResultsBy(result, /\.events\./);

		// they're equal, huzzah
		if (filtered.equal) continue;

		// otherwise, print and throw
		console.error(JSON.stringify(filtered, null, 2));
		console.error(`Difference Found in operationKey ${operationKey}.json`);
		process.exit(1);
	}

	console.log(`Diff(${blockheight}) — snapshots are identical.`);
}
