import type { TypedDocumentNode } from "@urql/core";

// returns the name of the first OperationDefinition
export function getFirstOperationName(document: TypedDocumentNode) {
	return (
		document.definitions.find((def) => def.kind === "OperationDefinition")?.name?.value ?? "Unknown"
	);
}

// returns the name of the first field on the first OperationDefinition
export function getFirstFieldName(document: TypedDocumentNode) {
	const firstOp = document.definitions.find((def) => def.kind === "OperationDefinition");
	const firstField = firstOp?.selectionSet?.selections[0];
	return firstField?.kind === "Field" ? firstField.name?.value : undefined;
}
