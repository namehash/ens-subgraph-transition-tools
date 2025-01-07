import { deepEqual } from "@jsonjoy.com/util/lib/json-equal/deepEqual";

export type JsonDiff = {
	equal: boolean;
	diff?: {
		added?: Record<string, unknown>;
		removed?: Record<string, unknown>;
		changed?: Record<
			string,
			{
				old: unknown;
				new: unknown;
			}
		>;
	};
};

// this code partially via claude
export function diffJson(a: Record<string, unknown>, b: Record<string, unknown>): JsonDiff {
	// check if objects are identical
	if (deepEqual(a, b)) return { equal: true };

	// not equal? provide diff

	// Handle non-object cases
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
		return {
			equal: false,
			diff: {
				changed: {
					"": { old: a, new: b },
				},
			},
		};
	}

	// Objects are different - compute detailed diff
	const diff: JsonDiff["diff"] = {};
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	// Find removed keys
	const removed = aKeys.filter((k) => !(k in b));
	if (removed.length) {
		diff.removed = Object.fromEntries(removed.map((k) => [k, a[k]]));
	}

	// Find added keys
	const added = bKeys.filter((k) => !(k in a));
	if (added.length) {
		diff.added = Object.fromEntries(added.map((k) => [k, b[k]]));
	}

	// Find changed values
	const changed = aKeys.filter((k) => k in b && a[k] !== b[k]);
	if (changed.length) {
		diff.changed = Object.fromEntries(
			changed.map((k) => [
				k,
				{
					old: (a as Record<string, unknown>)[k],
					new: (b as Record<string, unknown>)[k],
				},
			]),
		);
	}

	return {
		equal: Object.keys(diff).length === 0,
		diff: Object.keys(diff).length > 0 ? diff : undefined,
	};
}
