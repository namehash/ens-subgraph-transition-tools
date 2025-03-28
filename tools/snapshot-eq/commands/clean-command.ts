import { rm } from "node:fs/promises";

import { makeSnapshotDirectoryPath } from "@/lib/snapshots";
import type { Indexer } from "@/lib/types";
import type { ENSDeploymentChain } from "@ensnode/ens-deployments";

export async function cleanCommand(
	deploymentChain: ENSDeploymentChain,
	blockheight: number,
	indexer: Indexer,
) {
	const snapshotDirectory = makeSnapshotDirectoryPath({ deploymentChain, blockheight, indexer });
	await rm(snapshotDirectory, { recursive: true, force: true });

	console.log(`↳ Clean(${blockheight}, ${indexer}) done`);
}
