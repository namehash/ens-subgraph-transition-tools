import { resolve } from "node:path";

import type { Indexer } from "./types";

// NOTE: don't love this, is there a better way to get to the root of the monorepo?
const projectRootDir = resolve(__dirname, "../../..");

/**
 * describes a snapshot .json file
 */
export interface Snapshot {
	operationName: string;
	operationKey: number;
	items: { id: string }[];
}

export function makeSnapshotDirectoryPath({
	blockheight,
	indexer,
}: {
	blockheight: number;
	indexer: Indexer;
}) {
	return resolve(projectRootDir, "snapshots", blockheight.toString(), indexer);
}

/**
 * makes a snapshot path
 *
 * NOTE: important that operationKey is included in path in order to change cache key if query is
 * altered
 *
 * NOTE: underscore because operationKeu
 */
export function makeSnapshotPath({
	blockheight,
	indexer,
	operationName,
	offset,
	operationKey,
}: {
	blockheight: number;
	indexer: Indexer;
	operationName: string;
	offset: number;
	operationKey: string;
}) {
	return resolve(
		makeSnapshotDirectoryPath({ blockheight, indexer }),
		`${[operationName, offset, operationKey].join("_")}.json`,
	);
}

export function parseSnapshotName(name: string) {
	const [operationName, offset, operationKey] = name.split("_");
	return { operationName, offset: Number.parseInt(offset), operationKey };
}

export async function hasSnapshot(path: string) {
	return await Bun.file(path).exists();
}

export async function persistSnapshot(path: string, response: string) {
	return await Bun.write(path, response);
}

export async function getSnapshot(path: string) {
	return (await Bun.file(path).json()) as Snapshot;
}
