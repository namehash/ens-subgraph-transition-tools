import { Indexer } from "@/lib/types";

import { parse } from "node:path";
import { makeSnapshotDirectoryPath, makeSnapshotPath } from "@/lib/snapshots";
import { Glob } from "bun";
import { diffJson } from "eq-lib";

// helpful to ignore specific operationKeys to progress the diff
const IGNORE_OPERATION_KEYS: string[] = [];

function ignoreChangesetsByPath<T extends { path: string }>(changesets: T[], matches: RegExp[]) {
	return changesets.filter(({ path }) => !matches.some((match) => path.match(match)));
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
			console.error(`Ponder(${blockheight}) does not have '${operationKey}.json'`);
			continue;
		}

		const ponderSnapshot = await Bun.file(ponderSnapshotPath).json();

		console.log(`Diff(${operationKey}.json)`);

		// they both exist, let's diff them
		// TODO: why no inferred types??
		let changeset: { type: string; path: string }[];
		try {
			changeset = await diffJson(subgraphSnapshot, ponderSnapshot);
		} catch (error) {
			// an error here means that the diffJson lib failed, meaning they're definitely not equal
			console.error(
				`Difference Found in operationKey ${operationKey}.json (likely missing object sub-field in ponder snapshot)`,
			);
			process.exit(1);
		}

		// if you'd like, manually add RegExp[] here to ignore changesets by path, which is
		// helpful for manually continuing the diff job once a difference has been identified
		const filtered = ignoreChangesetsByPath(changeset, []);

		// they're equal, huzzah
		if (filtered.length === 0) continue;

		// otherwise, print and throw
		console.error(JSON.stringify(filtered, null, 2));
		console.error(`Difference Found in operationKey ${operationKey}.json`);
		process.exit(1);
	}

	console.log(`Diff(${blockheight}) — snapshots are identical.`);
}
