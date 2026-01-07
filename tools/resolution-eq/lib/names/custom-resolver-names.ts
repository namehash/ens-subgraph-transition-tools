/**
 * The following names are
 *  a) unexpired
 *  b) .eth subnames
 *  c) NOT using specific well-known resolver
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
 *   AND r.address NOT IN (
 *    '0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41',
 *    '0x231b0ee14048e9dccd1d247744d114a4eb5e8e63',
 *    '0xf29100983e058b709f3d539b0c765937b804ac15',
 *    '0xa2c122be93b0074270ebee7f6b7292c7deb45047',
 *    '0xa7d635c8de9a58a228aa69353a1699c7cc240dcf'
 *  )
 *  AND d.parent_id = '0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae'
 * LIMIT 10;
 */
export const CUSTOM_RESOLVER_NAMES = [
	"arrondesean.eth",
	"guifel.eth",
	"jcbeurope.eth",
	"guapx.eth",
	"felicis.eth",
	"omeshock.eth",
	"hanizam.eth",
	"hongng.eth",
	"visavis.eth",
	"world-bank.eth",
	"$fortknox.eth",
	"helloweb3dao.eth",
	"qilins.eth",
	"doujiawen.eth",
	"regenerated.eth",
	"forkpapi.eth",
	"megacity.eth",
	"libertycats.eth",
	"zhaobowen.eth",
	"thyself.eth",
	"aceboogie.eth",
	"danmerino.eth",
	"pingxixi.eth",
	"dragones.eth",
	"iamivan.eth",
	"billme.eth",
	"alphasatoshi.eth",
	"longeth.eth",
];
