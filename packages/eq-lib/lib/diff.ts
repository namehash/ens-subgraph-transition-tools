import { atomizeChangeset, diff } from "json-diff-ts";

// biome-ignore lint/suspicious/noExplicitAny: honestly easiest type
export function diffJson(a: any, b: any) {
	const diffs = diff(a, b, {
		treatTypeChangeAsReplace: false,
		embeddedObjKeys: {
			".": "id",
			events: "id",
		},
	});

	return atomizeChangeset(diffs);
}
