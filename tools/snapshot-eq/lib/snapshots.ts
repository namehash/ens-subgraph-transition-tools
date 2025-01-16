import { resolve } from 'node:path'

import type { Indexer } from "./types";

// NOTE: don't love this, is there a better way to get to the root of the monorepo?
const projectRootDir = resolve(__dirname, '../../..')

export function makeSnapshotDirectoryPath({
	blockheight,
	indexer,
}: {
	blockheight: number;
	indexer: Indexer;
}) {
	return resolve(projectRootDir, "snapshots", blockheight.toString(), indexer);
}

export function makeSnapshotPath({
	blockheight,
	indexer,
	operationKey,
}: {
	blockheight: number;
	indexer: Indexer;
	operationKey: string;
}) {
	return resolve(makeSnapshotDirectoryPath({ blockheight, indexer }), `${operationKey}.json`);
}

export async function hasSnapshot(path: string) {
	return await Bun.file(path).exists();
}

export async function persistSnapshot(path: string, response: string) {
	return await Bun.write(path, response);
}
