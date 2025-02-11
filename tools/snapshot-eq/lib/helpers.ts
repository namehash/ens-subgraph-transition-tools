import type { TypedDocumentNode } from "@urql/core";

export const makeSubgraphUrl = (apiKey: string) =>
	`https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH`;

// returns the name of the first OperationDefinition
export function getFirstOperationName(document: TypedDocumentNode) {
	return (
		document.definitions.find((def) => def.kind === "OperationDefinition")?.name?.value ?? "Unknown"
	);
}

export function getEnsnodeUrl() {
	if (!Bun.env.ENSNODE_URL) throw new Error("ENSNODE_URL required, see documentation.");
	return Bun.env.ENSNODE_URL;
}

export function getSubgraphApiKey() {
	if (!Bun.env.SUBGRAPH_API_KEY) throw new Error("SUBGRAPH_API_KEY required, see documentation.");
	return Bun.env.SUBGRAPH_API_KEY;
}
