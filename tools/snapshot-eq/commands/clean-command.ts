import { rm } from "node:fs/promises";

import { makeSnapshotDirectoryPath } from "@/lib/snapshots";
import type { Indexer } from "@/lib/types";
import type { ENSNamespaceId } from "@ensnode/datasources";

export async function cleanCommand(
	namespace: ENSNamespaceId,
	blockheight: number,
	indexer: Indexer,
) {
	const snapshotDirectory = makeSnapshotDirectoryPath({ namespace, blockheight, indexer });
	await rm(snapshotDirectory, { recursive: true, force: true });

	console.log(`↳ Clean(${blockheight}, ${indexer}) done`);
}
