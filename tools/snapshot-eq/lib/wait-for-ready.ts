import { ENSNodeClient } from "@ensnode/ensnode-sdk";
import { sleep } from "bun";
import ProgressBar from "progress";
import { getEnsnodeUrl } from "./helpers";

export async function waitForPonderReady(chainId: number, targetBlockheight: number) {
	const client = new ENSNodeClient({ url: new URL(getEnsnodeUrl()) });

	const getBlockheight = async () => {
		const data = await client.indexingStatus();

		switch (data.responseCode) {
			case "error": {
				throw new Error("Indexing Status Error");
			}
			case "ok": {
				const chain = data.realtimeProjection.snapshot.omnichainSnapshot.chains.get(chainId);
				if (!chain) {
					throw new Error(
						`Chain 1 not found\n${JSON.stringify(data.realtimeProjection.snapshot.omnichainSnapshot.chains)}`,
					);
				}

				if (chain.chainStatus === "chain-queued") return { ready: false, block: 0 };
				return {
					ready: chain.latestIndexedBlock.number === targetBlockheight,
					block: chain.latestIndexedBlock.number,
				};
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
			throw new Error(`ENSIndexer indexed further (${curr}) than expected ${targetBlockheight}!`);
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
