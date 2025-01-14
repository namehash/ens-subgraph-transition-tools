import fs from "node:fs/promises";

import { makeSnapshotDirectoryPath } from "@/lib/snapshots";
import type { Indexer } from "@/lib/types";

export async function cleanCommand(blockheight: number, indexer: Indexer) {
	const snapshotDirectory = makeSnapshotDirectoryPath({ blockheight, indexer });
	await fs.rm(snapshotDirectory, { recursive: true, force: true });

	console.log(`↳ Clean(${blockheight}, ${indexer}) done`);
}
