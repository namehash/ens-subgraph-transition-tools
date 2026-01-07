import pRetry from "p-retry";
import ProgressBar from "progress";
import { normalize } from "viem/ens";
import { ARGENT_NAMES } from "@/lib/names/argent-names";
import { BASENAMES_NAMES } from "@/lib/names/basenames-names";
import { CUSTOM_RESOLVER_NAMES } from "@/lib/names/custom-resolver-names";
import { ENSADMIN_NAMES } from "@/lib/names/ensadmin-names";
import { LINEANAMES_NAMES } from "@/lib/names/lineanames-names";
import { PUBLIC_RESOLVER_NAMES } from "@/lib/names/public-resolver-names";
import { RAFFY_NAMES } from "@/lib/names/raffy-names";
import { REVERSE_RESOLVER_NAMES } from "@/lib/names/reverse-resolver-names";
import { THOUSAND_CLUB_NAMES } from "@/lib/names/thousand-club-names";
import { THREEDNS_NAMES } from "@/lib/names/threedns-names";
import { UNMIGRATED_NAMES } from "@/lib/names/unmigrated-names";
import { resolveRecords } from "@/lib/resolve-records";

const ALL_NAMES = [
	...ARGENT_NAMES,
	...THOUSAND_CLUB_NAMES,
	...BASENAMES_NAMES,
	...CUSTOM_RESOLVER_NAMES,
	...ENSADMIN_NAMES,
	...LINEANAMES_NAMES,
	...PUBLIC_RESOLVER_NAMES,
	...RAFFY_NAMES,
	...REVERSE_RESOLVER_NAMES,
	...THREEDNS_NAMES,
	...UNMIGRATED_NAMES,
];

export async function resolutionTestCommand() {
	const bar = new ProgressBar("Testing [:bar] :current/:total :percent | :name (:speedup)", {
		complete: "=",
		incomplete: " ",
		width: 40,
		total: ALL_NAMES.length,
	});

	let totalAcceleratedTime = 0;
	let totalUnacceleratedTime = 0;
	let totalUniversalResolverTime = 0;
	let successfulResolutions = 0;

	for (const name of ALL_NAMES) {
		// TODO: encode unnormalied names as labelhashes and continue attempting resolution
		try {
			if (normalize(name) !== name) throw new Error("nope");
		} catch {
			bar.interrupt(
				`Skipping unnormalized name '${name}', see https://github.com/namehash/ensnode/issues/1032`,
			);
			bar.tick({ name, speedup: "" });
			continue;
		}

		let result: Awaited<ReturnType<typeof resolveRecords>>;
		try {
			result = await pRetry(
				async () => {
					const res = await resolveRecords(name);

					// if we have any diffs, try again
					const hasAcceleratedDiff = res.diffs.accelerated.length > 0;
					const hasUnacceleratedDiff = res.diffs.unaccelerated.length > 0;
					if (hasAcceleratedDiff || hasUnacceleratedDiff) {
						const { accelerated, unaccelerated, universalResolver, diffs } = res;

						throw new Error(`
❌ DIFF DETECTED for: ${name}

--- Timings (ms) ---
ENSNode API (accelerated):      ${accelerated.duration.toFixed(2)}ms
ENSNode API (unaccelerated):    ${unaccelerated.duration.toFixed(2)}ms
Universal Resolver (viem):      ${universalResolver.duration.toFixed(2)}ms

--- Data ---

Accelerated:
${JSON.stringify(accelerated.data, null, 2)}

Unaccelerated:
${JSON.stringify(unaccelerated.data, null, 2)}

Universal Resolver:
${JSON.stringify(universalResolver.data, null, 2)}

--- Diffs ---
Accelerated vs Universal Resolver:
${JSON.stringify(diffs.accelerated, null, 2)}

Unaccelerated vs Universal Resolver:
${JSON.stringify(diffs.unaccelerated, null, 2)}
`);
					}

					return res;
				},
				{
					retries: 3,
					minTimeout: 2000,
					onFailedAttempt: (error) => {
						bar.interrupt(
							`Attempt ${error.attemptNumber} failed for ${name}, ${error.retriesLeft} retries left.`,
						);
					},
				},
			);
		} catch (error) {
			bar.interrupt(error instanceof Error ? error.message : String(error));
			bar.tick({ name, speedup: "" });
			continue;
		}

		const { accelerated, unaccelerated, universalResolver } = result;

		// Track timings
		totalAcceleratedTime += accelerated.duration;
		totalUnacceleratedTime += unaccelerated.duration;
		totalUniversalResolverTime += universalResolver.duration;
		successfulResolutions++;

		// Calculate speedup vs Universal Resolver
		const acceleratedSpeedup = universalResolver.duration / accelerated.duration;
		const unacceleratedSpeedup = universalResolver.duration / unaccelerated.duration;
		const speedup = `${acceleratedSpeedup.toFixed(1)}x, ${unacceleratedSpeedup.toFixed(1)}x`;

		bar.tick({ name, speedup });
	}

	bar.terminate();

	// console.log("\n\n✅ All tests passed! No diffs detected.");

	if (successfulResolutions > 0) {
		const avgAccelerated = totalAcceleratedTime / successfulResolutions;
		const avgUnaccelerated = totalUnacceleratedTime / successfulResolutions;
		const avgUniversalResolver = totalUniversalResolverTime / successfulResolutions;

		console.log("\n--- Average Timings ---");
		console.log(
			`ENSNode API (accelerated):      ${avgAccelerated.toFixed(2)}ms (avg over ${successfulResolutions} names)`,
		);
		console.log(
			`ENSNode API (unaccelerated):    ${avgUnaccelerated.toFixed(2)}ms (avg over ${successfulResolutions} names)`,
		);
		console.log(
			`Universal Resolver (viem):      ${avgUniversalResolver.toFixed(2)}ms (avg over ${successfulResolutions} names)`,
		);

		console.log("\n--- Speedup vs Universal Resolver ---");
		const acceleratedSpeedup = avgUniversalResolver / avgAccelerated;
		const unacceleratedSpeedup = avgUniversalResolver / avgUnaccelerated;

		console.log(
			`Accelerated:    ${acceleratedSpeedup.toFixed(2)}x ${acceleratedSpeedup > 1 ? "faster" : "slower"}`,
		);
		console.log(
			`Unaccelerated:  ${unacceleratedSpeedup.toFixed(2)}x ${unacceleratedSpeedup > 1 ? "faster" : "slower"}`,
		);
	}
}
