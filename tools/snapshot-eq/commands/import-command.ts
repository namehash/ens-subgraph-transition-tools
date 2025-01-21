import { makeSnapshotArchivePath, makeSnapshotDirectoryPath } from "@/lib/snapshots";
import type { Indexer } from "@/lib/types";

export async function importCommand(blockheight: number, indexer: Indexer) {
	const inputFilePath = makeSnapshotArchivePath({ blockheight, indexer });
	const outputDirectory = makeSnapshotDirectoryPath({ blockheight, indexer });
	const proc = Bun.spawnSync(["unzip", inputFilePath, "-d", outputDirectory]);
	if (!proc.success) {
		console.error(proc.stderr);
		throw new Error(`Could not unzip ${inputFilePath}`);
	}
}
