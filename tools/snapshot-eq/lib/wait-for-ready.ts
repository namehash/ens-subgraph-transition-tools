import { EnsNodeClient, getLatestIndexedBlockRef } from "@ensnode/ensnode-sdk";
import { sleep } from "bun";
import ProgressBar from "progress";
import { getEnsnodeUrl } from "./helpers";

export async function waitForPonderReady(chainId: number, targetBlockheight: number) {
	const client = new EnsNodeClient({ url: new URL(getEnsnodeUrl()) });

	const getBlockheight = async () => {
		const data = await client.indexingStatus();

		if (data.responseCode === "error") throw new Error("Indexing Status Error");

		const latest = getLatestIndexedBlockRef(data.realtimeProjection.snapshot, chainId);

		// chain not configured for indexing, or queued and hasn't begun
		if (latest === null) return { ready: false, block: 0 };

		return {
			ready: latest.number >= targetBlockheight,
			block: latest.number,
		};
	};

	let { block: currentBlockheight } = await getBlockheight();

	const bar = new ProgressBar(
		"Indexing [:bar] :current/:total blocks (:percent) - :rate blocks/sec - :etas remaining",
		{
			complete: "=",
			incomplete: " ",
			width: 40,
			total: Math.max(targetBlockheight - currentBlockheight, 1),
		},
	);

	while (true) {
		const { ready, block: curr } = await getBlockheight();

		if (ready) break;

		if (curr > currentBlockheight) {
			bar.tick(curr - currentBlockheight);
			currentBlockheight = curr;
		}
		await sleep(2_000);
	}

	bar.terminate();
}
