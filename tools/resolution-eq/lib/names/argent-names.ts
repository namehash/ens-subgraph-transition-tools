/**
 * Argent Reverse Names + Subnames.
 *
 * SELECT
 *     d.name AS reverse_domain,
 *     d.id AS node,
 *     rr.name AS resolved_name,
 *     rr.resolver,
 *     resolved.expiry_date,
 *     to_timestamp(resolved.expiry_date::bigint) AS expiry_timestamp
 * FROM "alphaSchema1.3.1".subgraph_domains d
 * INNER JOIN "alphaSchema1.3.1".resolver_records rr ON d.id = rr.node
 * INNER JOIN "alphaSchema1.3.1".subgraph_domains resolved ON rr.name = resolved.name
 * WHERE d.name LIKE '%.addr.reverse'
 *   AND d.name NOT LIKE '[%'
 *   AND rr.resolver = '0xda1756bb923af5d1a05e277cb1e54f1d0a127890'
 * LIMIT 10;
 */
export const ARGENT_NAMES = [
	//////////////////////////
	// Argent Reverse Resolver (0xda1756bb923af5d1a05e277cb1e54f1d0a127890)
	//////////////////////////
	"5629019a0d5c3dba01f19931a25eb25bf6f8b4a6.addr.reverse",
	"9b460ba4f0e0f18d17ef0f3d3c0cc71373ad7330.addr.reverse",
	"45cb7b221a4d1fed8bf4b0a3c80509a3d1ffdbfc.addr.reverse",
	"4af74052b478f8cfbf1db4675c75a8d08dc727c5.addr.reverse",
	"6da1063a4b020249b1f674f483a33bcaaf994ea9.addr.reverse",
	"e5413bf5f7152198a7966b0000398cbb07eedc1d.addr.reverse",
	"74b61938500f82ec66855f0b88f1691a530d2f35.addr.reverse",
	"88d746e344f5ce7bdd2adaa89405a0da90dbeea1.addr.reverse",
	"065f141a1ef8620c044c979927c5c61441931831.addr.reverse",
	"e99b60645b7afaae74670df6bf62a543d810deb3.addr.reverse",

	//////////////////////////
	// .argent.xyz Names (the name records for the above reverse names)
	//////////////////////////
	"sandrac.argent.xyz",
	"portner.argent.xyz",
	"hagaetc.argent.xyz",
	"darioma.argent.xyz",
	"crypto1.argent.xyz",
	"lasseclausen.argent.xyz",
	"erian.argent.xyz",
	"ceoanddj.argent.xyz",
	"bensmith.argent.xyz",
	"katka.argent.xyz",
];
