import { Indexer } from "@/lib/types";
import yargs from "yargs/yargs";

import { cleanCommand } from "@/commands/clean-command";
import { diffCommand } from "@/commands/diff-command";
import { snapshotCommand } from "@/commands/snapshot-command";
import type { ENSDeploymentChain } from "@ensnode/ens-deployments";

yargs(process.argv.slice(2))
	.scriptName("snapshot-eq")
	.option("deployment", {
		type: "string",
		description: "ENS deployment chain",
		default: "mainnet",
		global: true,
	})
	.command(
		"snapshot <blockheight> <indexer>",
		"Take snapshot of subgraph state at blockheight",
		(yargs) => {
			return yargs
				.positional("blockheight", {
					type: "number",
					description: "Block height to snapshot",
					demandOption: true,
				})
				.positional("indexer", {
					choices: Object.values(Indexer),
					description: "Indexer to snapshot from",
					demandOption: true,
				});
		},
		async (argv) => {
			await snapshotCommand(
				argv.deployment as ENSDeploymentChain,
				argv.blockheight,
				argv.indexer as Indexer,
			);
		},
	)
	.command(
		"clean <blockheight> <indexer>",
		"Clean snapshot at blockheight",
		(yargs) => {
			return yargs
				.positional("blockheight", {
					type: "number",
					description: "Block height to clean",
					demandOption: true,
				})
				.positional("indexer", {
					choices: Object.values(Indexer),
					description: "Indexer to clean",
					demandOption: true,
				});
		},
		async (argv) => {
			await cleanCommand(
				argv.deployment as ENSDeploymentChain,
				argv.blockheight,
				argv.indexer as Indexer,
			);
		},
	)
	.command(
		"diff <blockheight>",
		"Diff snapshots at blockheight",
		(yargs) => {
			return yargs.positional("blockheight", {
				type: "number",
				description: "Block height to diff",
				demandOption: true,
			});
		},
		async (argv) => {
			await diffCommand(argv.deployment as ENSDeploymentChain, argv.blockheight);
		},
	)
	.strict()
	.demandCommand()
	.parse();
