import type { ENSDeploymentChain } from "@ensnode/ens-deployments";
import type { TypedDocumentNode } from "@urql/core";

export const makeSubgraphUrl = (deploymentChain: ENSDeploymentChain, apiKey: string) => {
	switch (deploymentChain) {
		case "mainnet":
			return "https://graphnode.namehashlabs.org:8000/subgraphs/name/namehash/ens-subgraph-mainnet";
		case "sepolia":
			return "https://graphnode.namehashlabs.org:8000/subgraphs/name/namehash/ens-subgraph-3";
		case "holesky":
			return "https://graphnode.namehashlabs.org:8000/subgraphs/name/namehash/ens-subgraph-holesky";
		default:
			throw new Error(`Unsupported --deployment: ${deploymentChain}`);
	}
};

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
