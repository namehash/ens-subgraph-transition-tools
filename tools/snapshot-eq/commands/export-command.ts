import { makeSnapshotArchivePath, makeSnapshotDirectoryPath } from "@/lib/snapshots";
import type { Indexer } from "@/lib/types";

export async function exportCommand(blockheight: number, indexer: Indexer) {
	const inputDirectory = makeSnapshotDirectoryPath({ blockheight, indexer });
	const outputFilepath = makeSnapshotArchivePath({ blockheight, indexer });
	const proc = Bun.spawnSync(["zip", "-j", "-r", outputFilepath, inputDirectory]);
	if (!proc.success) {
		console.error(proc.stderr);
		throw new Error(`Could not zip ${inputDirectory}`);
	}
}
