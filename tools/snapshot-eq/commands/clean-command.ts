import { makeSnapshotDirectoryPath } from "@/lib/snapshots";
import type { Indexer } from "@/lib/types";
import type { ENSDeploymentChain } from "@ensnode/ens-deployments";

export async function cleanCommand(
	deploymentChain: ENSDeploymentChain,
	blockheight: number,
	indexer: Indexer,
) {
	const snapshotDirectory = makeSnapshotDirectoryPath({ deploymentChain, blockheight, indexer });

	Bun.spawnSync(["git", "annex", "drop", snapshotDirectory], { stdout: "inherit" });

	console.log(`↳ Clean(${blockheight}, ${indexer}) done`);
}
