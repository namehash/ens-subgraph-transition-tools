import { clone } from "@jsonjoy.com/util/lib/json-clone";
import type { TypedDocumentNode } from "@urql/core";
import type { FieldNode } from "graphql";

export function injectSubgraphBlockHeightArgument(query: TypedDocumentNode, blockheight: number) {
	// deep clone query
	const document = clone(query);

	const operationDefs = document.definitions.filter((def) => def.kind === "OperationDefinition");

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

	for (const operation of operationDefs) {
		const firstField = operation.selectionSet?.selections[0];
		if (!firstField) continue;

		const field = firstField as FieldNode;
		// @ts-expect-error ignore readonly typing
		field.arguments = [blockArg, ...(field.arguments ?? [])];
	}

	return document;
}
