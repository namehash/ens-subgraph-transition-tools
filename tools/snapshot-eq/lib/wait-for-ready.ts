import { PonderMeta } from "@/queries/PonderMeta";
import { ENSNodeClient } from "@ensnode/ensnode-sdk";
import { sleep } from "bun";
import { makeClient } from "eq-lib";
import ProgressBar from "progress";
import { getEnsnodeUrl } from "./helpers";

export async function waitForPonderReady(networkId: string, targetBlockheight: number) {
	const client = new ENSNodeClient({ url: new URL(getEnsnodeUrl()) });

	const getBlockheight = async () => {
		const data = await client.indexingStatus();

		switch (data.overallStatus) {
			case "unstarted": {
				return { ready: false, block: 0 };
			}
			case "indexer-error": {
				throw new Error(`ENSIndexer Indexing Status Error: ${data}`);
			}
			case "following": {
				throw new Error("ENSIndexer is following but shouldn't be in snapshot mode.");
			}
			case "backfill":
			case "completed": {
				const chainStatus = data.chains.get(Number(networkId));

				if (!chainStatus) {
					throw new Error(`Invariant: ENSIndexer is indexing ${networkId}`);
				}

				if (chainStatus.config.endBlock?.number !== targetBlockheight) {
					throw new Error(`Invariant: ENSIndexer must be indexing to ${targetBlockheight}`);
				}

				switch (chainStatus.status) {
					case "unstarted": {
						return { ready: false, block: 0 };
					}
					case "backfill": {
						return { ready: false, block: chainStatus.latestIndexedBlock.number };
					}
					case "completed": {
						// TODO: re-enable once ponder fixes the off-by-n-if-no-events issue
						// if (chainStatus.latestIndexedBlock.number !== targetBlockheight) {
						// 	throw new Error(
						// 		`Invariant: ENSIndexer says chain ${networkId} is completed but latestIndexedBlock isn't ${targetBlockheight}: ${JSON.stringify(chainStatus)}`,
						// 	);
						// }
						return { ready: true, block: targetBlockheight };
					}
				}
			}
		}
	};

	let { block: currentBlockheight } = await getBlockheight();

	const bar = new ProgressBar(
		"Indexing [:bar] :current/:total blocks (:percent) - :rate blocks/sec - :etas remaining",
		{
			complete: "=",
			incomplete: " ",
			width: 40,
			total: targetBlockheight - currentBlockheight,
		},
	);

	while (true) {
		const { ready, block: curr } = await getBlockheight();

		// error check
		if (curr > targetBlockheight) {
			throw new Error(`ENSIndexer indexed further than expected ${targetBlockheight}!`);
		}

		// huzzah
		if (curr === targetBlockheight && ready) break;

		// otherwise, progress & wait
		bar.tick(curr - currentBlockheight);
		currentBlockheight = curr;
		await sleep(2_000);
	}

	bar.terminate();
}
