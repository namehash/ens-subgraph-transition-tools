/**
 * The following names are
 *  a) unexpired
 *  b) base.eth subnames
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
 *   and d.parent_id = '0xff1e3c0eb00ec714e34b6114125fbde1dea2f24a72fbf672e7b7fd5690328e10'
 * LIMIT 30;
 */
export const BASENAMES_NAMES = [
	"v8z38li.base.eth",
	"98lqyuxtfg.base.eth",
	"qzn43b5.base.eth",
	"d0axvriq.base.eth",
	"8b437c37ba.base.eth",
	"blocksynth.base.eth",
	"yarielbaltazar73.base.eth",
	"nosell.base.eth",
	"4sx9yt.base.eth",
	"lukemoxham.base.eth",
	"f8gv9v.base.eth",
	"yiun2y4y.base.eth",
	"riqb1q.base.eth",
	"k62rg7t92g.base.eth",
	"stouuhn95.base.eth",
	"selwyn.base.eth",
	"donpablo99.base.eth",
	"hgyhihe.base.eth",
	"ntzxzo137e.base.eth",
	"peacefulaura.base.eth",
	"ffo4z.base.eth",
	"5nrvnapc9c.base.eth",
	"sbmdh.base.eth",
	"6uadap1.base.eth",
	"egbyrbk13i.base.eth",
	"talonone.base.eth",
	"ph2ym9n.base.eth",
	"kys5b13x.base.eth",
	"95phzj.base.eth",
	"ng040u.base.eth",
];
