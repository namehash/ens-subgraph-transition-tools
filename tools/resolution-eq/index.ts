import ProgressBar from "progress";
import { normalize } from "viem/ens";
import yargs from "yargs/yargs";
import { resolveRecords } from "@/lib/resolve-records";
import { TEST_NAMES } from "@/lib/test-names";

yargs(process.argv.slice(2))
	.scriptName("resolution-eq")
	.command(
		"compare <name>",
		"Compare ENS resolution across ENSNode and Viem",
		(yargs) =>
			yargs.positional("name", {
				describe: "ENS name to resolve",
				type: "string",
				demandOption: true,
			}),
		async (argv) => {
			const { accelerated, unaccelerated, universalResolver, diffs } = await resolveRecords(
				argv.name as string,
			);

			console.log("\n=== ENS Lookup Comparison ===");
			console.log(`Name: ${argv.name}`);
			console.log("\n--- Timings (ms) ---");
			console.log(`ENSNode API (accelerated):      ${accelerated.duration.toFixed(2)}ms`);
			console.log(`ENSNode API (unaccelerated):    ${unaccelerated.duration.toFixed(2)}ms`);
			console.log(`Universal Resolver (viem):      ${universalResolver.duration.toFixed(2)}ms`);

			console.log("\n--- Data ---");
			console.log("\nAccelerated:");
			console.log(JSON.stringify(accelerated.data, null, 2));

			console.log("\nUnaccelerated:");
			console.log(JSON.stringify(unaccelerated.data, null, 2));

			console.log("\nUniversal Resolver:");
			console.log(JSON.stringify(universalResolver.data, null, 2));

			console.log("\n--- Diffs ---");

			console.log("\nAccelerated vs Universal Resolver:");
			console.log(JSON.stringify(diffs.accelerated, null, 2));

			console.log("\nUnaccelerated vs Universal Resolver:");
			console.log(JSON.stringify(diffs.unaccelerated, null, 2));
		},
	)
	.command(
		"test",
		"Test all example ENS names for resolution consistency",
		() => {},
		async () => {
			const bar = new ProgressBar("Testing [:bar] :current/:total :percent | :name", {
				complete: "=",
				incomplete: " ",
				width: 40,
				total: TEST_NAMES.length,
			});

			for (const name of TEST_NAMES) {
				bar.tick({ name });

				// TODO: encode unnormalied names as labelhashes and continue attempting resolution
				try {
					if (normalize(name) !== name) throw new Error("nope");
				} catch {
					bar.interrupt(
						`Skipping unnormalized name '${name}', see https://github.com/namehash/ensnode/issues/1032`,
					);
					continue;
				}

				const { accelerated, unaccelerated, universalResolver, diffs } = await resolveRecords(name);

				// Check if there are any diffs
				const hasAcceleratedDiff = diffs.accelerated.length > 0;
				const hasUnacceleratedDiff = diffs.unaccelerated.length > 0;

				if (hasAcceleratedDiff || hasUnacceleratedDiff) {
					bar.interrupt(`\n\n❌ DIFF DETECTED for: ${name}`);
					bar.interrupt("\n--- Timings (ms) ---");
					bar.interrupt(`ENSNode API (accelerated):      ${accelerated.duration.toFixed(2)}ms`);
					bar.interrupt(`ENSNode API (unaccelerated):    ${unaccelerated.duration.toFixed(2)}ms`);
					bar.interrupt(
						`Universal Resolver (viem):      ${universalResolver.duration.toFixed(2)}ms`,
					);

					bar.interrupt("\n--- Data ---");
					bar.interrupt("\nAccelerated:");
					bar.interrupt(JSON.stringify(accelerated.data, null, 2));

					bar.interrupt("\nUnaccelerated:");
					bar.interrupt(JSON.stringify(unaccelerated.data, null, 2));

					bar.interrupt("\nUniversal Resolver:");
					bar.interrupt(JSON.stringify(universalResolver.data, null, 2));

					bar.interrupt("\n--- Diffs ---");

					if (hasAcceleratedDiff) {
						bar.interrupt("\nAccelerated vs Universal Resolver:");
						bar.interrupt(JSON.stringify(diffs.accelerated, null, 2));
					}

					if (hasUnacceleratedDiff) {
						bar.interrupt("\nUnaccelerated vs Universal Resolver:");
						bar.interrupt(JSON.stringify(diffs.unaccelerated, null, 2));
					}

					process.exit(1);
				}
			}

			bar.terminate();

			console.log("\n\n✅ All tests passed! No diffs detected.");
		},
	)
	.strict()
	.demandCommand()
	.parse();
