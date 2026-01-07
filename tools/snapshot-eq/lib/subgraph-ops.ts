import type { TypedDocumentNode } from "@urql/core";
import { type ASTNode, type OperationDefinitionNode, visit } from "graphql";

export function injectSubgraphBlockHeightArgument(query: TypedDocumentNode, blockheight: number) {
	// remove the key to force urql to treat the following as a new document
	// otherwise its internal cache logic would normalize the new argument out
	// of the query

	const newQuery = { ...query };
	// biome-ignore lint/suspicious/noExplicitAny: required to delete urql internal cache keys
	delete (newQuery as any).__key;
	// biome-ignore lint/suspicious/noExplicitAny: required to delete urql internal cache keys
	delete (newQuery as any).loc;

	return visit(newQuery, {
		Field: {
			enter(node, _key, _parent, _path, ancestors) {
				const isRootLevelQuery =
					ancestors.length === 4 &&
					(ancestors[2] as ASTNode)?.kind === "OperationDefinition" &&
					(ancestors[2] as OperationDefinitionNode)?.operation === "query";

				if (!isRootLevelQuery) return;

				const blockArg = {
					kind: "Argument",
					name: { kind: "Name", value: "block" },
					value: {
						kind: "ObjectValue",
						fields: [
							{
								kind: "ObjectField",
								name: { kind: "Name", value: "number" },
								value: { kind: "IntValue", value: blockheight.toString() },
							},
						],
					},
				};

				return {
					...node,
					arguments: [blockArg, ...(node.arguments ?? [])],
				};
			},
		},
	}) as TypedDocumentNode;
}
