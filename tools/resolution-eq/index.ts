import yargs from "yargs/yargs";

yargs(process.argv.slice(2))
	.scriptName("resolution-eq")
	.command(
		"integration-test",
		"Run integration tests comparing ENS resolution across services",
		() => {},
		async () => {
			// TODO: Implementation
		},
	)
	.strict()
	.demandCommand()
	.parse();
