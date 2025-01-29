import { Indexer } from "@/lib/types";

import { parse } from "node:path";
import { makeSnapshotDirectoryPath, makeSnapshotPath } from "@/lib/snapshots";
import { Glob } from "bun";
import { diffJson } from "eq-lib";

function filterResultsBy(result: ReturnType<typeof diffJson>, fieldName: string) {
	const [first, second] = fieldName.split(".");
	if (result.key !== first) return result;

	const filtered = Object.fromEntries(
		Object.entries(result.diffs).filter(([path, diff]) => path.split(".")[1] !== second),
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

		const filtered = result;
		// const filtered = filterResultsBy(
		// 	filterResultsBy(filterResultsBy(result, "wrappedDomains.name"), "accounts.name"),
		// 	"resolvers.coinTypes",
		// );

		// they're equal, huzzah
		if (filtered.equal) continue;

		// otherwise, print and throw
		console.error(`Difference Found in operationKey ${operationKey}.json`);
		console.error(JSON.stringify(filtered, null, 2));
		process.exit(1);
	}

	console.log(`Diff(${blockheight}) — snapshots are identical.`);
}
