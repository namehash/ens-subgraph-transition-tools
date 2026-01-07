import yargs from "yargs/yargs";
import { resolveRecords } from "@/lib/resolve-records";
import { resolutionTestCommand } from "./commands/resolution-test-command";

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
			await resolutionTestCommand();
		},
	)
	.strict()
	.demandCommand()
	.parse();
