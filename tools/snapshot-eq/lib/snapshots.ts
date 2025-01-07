import type { Indexer } from "./types";

export function makeSnapshotPath({
	blockheight,
	indexer,
	operationKey,
}: {
	blockheight: number;
	indexer: Indexer;
	operationKey: string;
}) {
	return ["snapshots", blockheight, indexer, `${operationKey}.json`].join("/");
}

export async function hasSnapshot(path: string) {
	return await Bun.file(path).exists();
}

export async function persistSnapshot(path: string, response: string) {
	await Bun.write(path, response);
}
