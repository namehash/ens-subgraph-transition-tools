import { Indexer } from "@/lib/types";
import yargs from "yargs/yargs";

import { cleanCommand } from "@/commands/clean-command";
import { diffCommand } from "@/commands/diff-command";
import { snapshotCommand } from "@/commands/snapshot-command";

yargs(process.argv.slice(2))
	.scriptName("snapshot-eq")
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
			await snapshotCommand(argv.blockheight, argv.indexer as Indexer);
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
			await cleanCommand(argv.blockheight, argv.indexer as Indexer);
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
			await diffCommand(argv.blockheight);
		},
	)
	.strict()
	.demandCommand()
	.parse();
