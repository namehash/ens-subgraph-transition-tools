/**
 * most of this file courtesy of claude 3.5 ty
 */

import { deepEqual } from "@jsonjoy.com/util/lib/json-equal/deepEqual";

export type JsonDiff = {
	equal: boolean;
	key?: string;
	missing?: Array<{ id: string }>;
	unexpected?: Array<{ id: string }>;
	diffs?: Record<
		string,
		{
			subgraph: unknown;
			__ponder: unknown;
		}
	>;
};

export function diffJson(aArray: Array<{ id: string }>, bArray: Array<{ id: string }>): JsonDiff {
	if (deepEqual(aArray, bArray)) return { equal: true };

	const diffs: Required<JsonDiff>["diffs"] = {};
	const missing: Array<{ id: string }> = [];
	const unexpected: Array<{ id: string }> = [];

	// Create maps for faster lookups
	const aMap = new Map(aArray.map((item) => [item.id, item]));
	const bMap = new Map(bArray.map((item) => [item.id, item]));

	// Find missing and unexpected items
	for (const itemA of aArray) {
		if (!bMap.has(itemA.id)) {
			unexpected.push({ id: itemA.id });
		}
	}

	for (const itemB of bArray) {
		if (!aMap.has(itemB.id)) {
			missing.push({ id: itemB.id });
		}
	}

	// Compare matching items
	for (const [id, itemB] of bMap) {
		const itemA = aMap.get(id);
		if (!itemA) continue;

		// biome-ignore lint/suspicious/noExplicitAny: needed for recursive comparison
		function compare(objA: any, objB: any, path = "") {
			if (typeof objA !== "object" || typeof objB !== "object" || objA === null || objB === null) {
				if (objA !== objB) {
					diffs[path] = { subgraph: objA, __ponder: objB };
				}
				return;
			}

			const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

			for (const key of keys) {
				if (key === "id") continue; // Skip comparing IDs since we know they match
				const newPath = path ? `${path}.${key}` : `${id}.${key}`;

				if (!(key in objA)) {
					diffs[newPath] = { subgraph: undefined, __ponder: objB[key] };
				} else if (!(key in objB)) {
					diffs[newPath] = { subgraph: objA[key], __ponder: undefined };
				} else {
					compare(objA[key], objB[key], newPath);
				}
			}
		}

		compare(itemA, itemB);
	}

	return {
		equal: Object.keys(diffs).length === 0 && missing.length === 0 && unexpected.length === 0,
		missing,
		unexpected,
		diffs,
	};
}
