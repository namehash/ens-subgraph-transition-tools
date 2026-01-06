/**
 * The following names are
 *  a) unexpired
 *  b) using specific well-known Default resolvers
 * as of a query on 2026-01-06.
 *
 * SELECT
 *     a.name,
 *     d.id AS node,
 *     d.owner_id,
 *     d.expiry_date,
 *     to_timestamp(d.expiry_date::bigint) AS expiry_timestamp,
 *     r.address AS resolver_address
 * FROM (
 *     SELECT value AS name
 *     FROM "alphaSchema1.3.1".reverse_name_records
 *     WHERE value IS NOT NULL AND value != ''
 *
 *     UNION
 *
 *     SELECT name
 *     FROM "alphaSchema1.3.1".resolver_records
 *     WHERE name IS NOT NULL AND name != ''
 * ) a
 * INNER JOIN "alphaSchema1.3.1".subgraph_domains d ON d.name = a.name
 * INNER JOIN "alphaSchema1.3.1".subgraph_resolvers r ON d.id = r.domain_id
 * WHERE d.expiry_date > EXTRACT(EPOCH FROM NOW())
 *   AND r.address = :specific-resolver-address
 * LIMIT 10;
 */
export const PUBLIC_RESOLVER_NAMES = [
	//////////////////////////
	// DefaultPublicResolver1 (0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41)
	//////////////////////////
	"13e13.eth",
	"fartoolong.eth",
	"211168.eth",
	"0xc29.eth",
	"netz.eth",
	"xventure.eth",
	"singhol.eth",
	"cryptoai.eth",
	"whitelies.eth",
	"ai365.eth",

	//////////////////////////
	// DefaultPublicResolver2 (0x231b0ee14048e9dccd1d247744d114a4eb5e8e63)
	//////////////////////////
	"230123.eth",
	"samuelgribeirof.eth",
	"kirkortis.eth",
	"hahahgwg.eth",
	"mystro.eth",
	"muski.eth",
	"iotlab.eth",
	"meggy.eth",
	"pepelangelo.eth",
	"13e13.eth",

	//////////////////////////
	// DefaultPublicResolver3 (0xf29100983e058b709f3d539b0c765937b804ac15)
	//////////////////////////
	"farcatser.eth",
	"web3river.eth",
	"tester-2911.eth",
	"antrx.eth",
	"sasanianempire.eth",
	"namlongdao.eth",
	"ipolino.eth",
	"999111999.eth",
	"bubson.eth",
	"valimetrix.eth",
];
