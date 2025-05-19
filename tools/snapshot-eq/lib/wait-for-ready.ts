import { PonderMeta } from "@/queries/PonderMeta";
import { sleep } from "bun";
import { makeClient } from "eq-lib";
import ProgressBar from "progress";
import { getEnsnodeUrl } from "./helpers";

export async function waitForPonderReady(networkId: string, targetBlockheight: number) {
	const ponderApiClient = makeClient(`${getEnsnodeUrl()}/ponder`);

	const getBlockheight = async () => {
		const { data } = await ponderApiClient.query(PonderMeta);

		if (!data) throw new Error("ENSIndexer API unavailable!");

		try {
			const {
				ready,
				block: { number: ponderBlockheight },
			} = data._meta.status[networkId];

			return { ready, block: ponderBlockheight };
		} catch (error) {
			console.log(data);
			throw error;
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
