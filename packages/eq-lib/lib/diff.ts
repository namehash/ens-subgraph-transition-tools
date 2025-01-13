import { deepEqual } from "@jsonjoy.com/util/lib/json-equal/deepEqual";

export type JsonDiff = {
	equal: boolean;
	diffs?: Record<
		string,
		{
			old: unknown;
			new: unknown;
		}
	>;
};

export function diffJson(a: Record<string, unknown>, b: Record<string, unknown>): JsonDiff {
	if (deepEqual(a, b)) return { equal: true };

	const diffs: Required<JsonDiff>["diffs"] = {};

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	function compare(objA: any, objB: any, path = "") {
		if (typeof objA !== "object" || typeof objB !== "object" || objA === null || objB === null) {
			if (objA !== objB) {
				diffs[path] = { old: objA, new: objB };
			}
			return;
		}

		const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

		for (const key of keys) {
			const newPath = path ? `${path}.${key}` : key;

			if (!(key in objA)) {
				diffs[newPath] = { old: undefined, new: objB[key] };
			} else if (!(key in objB)) {
				diffs[newPath] = { old: objA[key], new: undefined };
			} else {
				compare(objA[key], objB[key], newPath);
			}
		}
	}

	compare(a, b);

	return {
		equal: Object.keys(diffs).length === 0,
		diffs,
	};
}
