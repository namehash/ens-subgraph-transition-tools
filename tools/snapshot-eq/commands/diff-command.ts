import { Indexer } from "@/lib/types";

import { resolve } from "node:path";
import { getFirstOperationName } from "@/lib/helpers";
import { getSnapshot, makeSnapshotDirectoryPath } from "@/lib/snapshots";
import { ALL_QUERIES } from "@/queries";
import type { ENSNamespaceId } from "@ensnode/datasources";
import { Glob } from "bun";
import { atomizeChangeset, diff } from "json-diff-ts";
import ProgressBar from "progress";

// biome-ignore lint/suspicious/noExplicitAny: honestly easiest type
function diffSnapshots(a: any, b: any) {
	const diffs = diff(a, b, {
		treatTypeChangeAsReplace: false,
		embeddedObjKeys: {
			items: "id",
			events: "id",
		},
	});

	return atomizeChangeset(diffs);
}

function ignoreChangesetsByPath<T extends { path: string }>(changesets: T[], matches: RegExp[]) {
	return changesets.filter(({ path }) => !matches.some((match) => path.match(match)));
}

function ignoreChangesetsByType<T extends { type: string }>(changesets: T[], types: string[]) {
	return changesets.filter(({ type }) => !types.includes(type));
}

async function diffOperationName(
	operationName: string,
	namespace: ENSNamespaceId,
	blockheight: number,
) {
	const subgraphSnapshotDirectory = makeSnapshotDirectoryPath({
		namespace: namespace,
		blockheight,
		indexer: Indexer.Subgraph,
	});

	const ponderSnapshotDirectory = makeSnapshotDirectoryPath({
		namespace: namespace,
		blockheight,
		indexer: Indexer.ENSNode,
	});

	const subgraphSnapshots = [
		...new Glob("*.json").scanSync({
			cwd: subgraphSnapshotDirectory,
			followSymlinks: true,
		}),
	].filter((name) => name.startsWith(operationName));

	const bar = new ProgressBar(
		`${operationName} [:bar] :current/:total snapshots (:percent) - :rate snapshots/sec - :etas remaining (:snapshotFileName)`,
		{
			complete: "=",
			incomplete: " ",
			width: 40,
			total: subgraphSnapshots.length,
		},
	);

	for await (const snapshotFileName of subgraphSnapshots) {
		// subgraph snapshot guaranteed to exist
		const subgraphSnapshotPath = resolve(subgraphSnapshotDirectory, snapshotFileName);
		const subgraphSnapshot = await getSnapshot(subgraphSnapshotPath);

		// ponder snapshot not guaranteed
		const ponderSnapshotPath = resolve(ponderSnapshotDirectory, snapshotFileName);
		const exists = await Bun.file(ponderSnapshotPath).exists();
		if (!exists) {
			console.error(`Ponder(${blockheight}) does not have '${snapshotFileName}'.`);
			process.exit(1);
		}

		const ponderSnapshot = await Bun.file(ponderSnapshotPath).json();

		// they both exist, let's diff them
		// TODO: why no inferred types??
		let changeset: ReturnType<typeof diffSnapshots>;
		try {
			changeset = diffSnapshots(subgraphSnapshot, ponderSnapshot);
		} catch (error) {
			// an error here means that the diffJson lib failed, so they're definitely not equal
			console.error(
				`Difference found in ${snapshotFileName} (likely missing object sub-field in ponder snapshot)`,
			);
			process.exit(1);
		}

		// the subgraph is having a hard time with event ids for some reason where,
		// intermittently, the event ids returned by the subgraph are off-by-one.
		// in that case if that's the only issue we see we want to delete the snapshot
		// to progress the diff and instruct the user to re-snapshot the subgraph to pull the hopefully
		// correct information down instead.
		const eventIdMismatches = changeset.filter(
			(cs) => cs.path.match(/\.events\[\d+\]\.id$/) !== null,
		);
		const hasChangesets = changeset.length > 0;
		const onlyDiffIsEventId = changeset.length === eventIdMismatches.length;
		if (hasChangesets && onlyDiffIsEventId) {
			// has only event id mismatches
			await Bun.file(subgraphSnapshotPath).delete();
			bar.interrupt(
				`Deleted ${snapshotFileName} because of event id mismatch — make sure to re-snapshot the subgraph.`,
			);
			continue;
		}

		///
		/// Changeset Filters
		///

		// helpful to ignore specific snapshot file names to progress the diff
		const IGNORE_FILENAMES: string[] = ["Resolvers_3860000_-935910546.json"];
		const filteredByFilename = changeset.filter(() => !IGNORE_FILENAMES.includes(snapshotFileName));

		// if you'd like, manually add RegExp[] here to ignore changesets by path, which is
		// helpful for manually continuing the diff job once a pattern has been identified
		// i.e. ignore all diffs related to a Domain.wrappedDomain.id: /\.wrappedDomain\.id$/
		const filteredByPath = ignoreChangesetsByPath(filteredByFilename, []);

		// if you'd like, ignore changesets by 'type', helpful for ignoring out-of-order entities
		const filtered = ignoreChangesetsByType(filteredByPath, ["ADD", "REMOVE"]);

		///
		/// end changeset filters
		///

		// they're equal, huzzah
		if (filtered.length === 0) {
			bar.tick(1, { snapshotFileName });
			continue;
		}

		// otherwise, print and throw
		console.error(JSON.stringify(filtered, null, 2));
		console.error(`Difference found in ${snapshotFileName}`);
		process.exit(1);
	}
}

export async function diffCommand(namespace: ENSNamespaceId, blockheight: number) {
	for (const [document] of ALL_QUERIES) {
		const operationName = getFirstOperationName(document);
		await diffOperationName(operationName, namespace, blockheight);
	}

	console.log(`Diff(${blockheight}) — snapshots are identical.`);
}
