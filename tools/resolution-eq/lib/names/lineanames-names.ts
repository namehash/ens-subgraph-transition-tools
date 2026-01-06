/**
 * The following names are
 *  a) unexpired
 *  b) linea.eth subnames
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
 *   and d.parent_id = '0x527aac89ac1d1de5dd84cff89ec92c69b028ce9ce3fa3d654882474ab4402ec3'
 * LIMIT 30;
 */
export const LINEANAMES_NAMES = [
	"54r4r4.linea.eth",
	"56r4r32.linea.eth",
	"iguanter.linea.eth",
	"confuse.linea.eth",
	"blushing.linea.eth",
	"rivb.linea.eth",
	"xisa.linea.eth",
	"9ph.linea.eth",
	"bitcoinscamm.linea.eth",
	"gogo8.linea.eth",
	"crape.linea.eth",
	"misstown.linea.eth",
	"fdhsdhwfh.linea.eth",
	"44462.linea.eth",
	"c1hrs.linea.eth",
	"sdafasdkfdsafsdfads.linea.eth",
	"butia.linea.eth",
	"sdfgsqq.linea.eth",
	"coffea.linea.eth",
	"coninglo.linea.eth",
	"kplkpl1.linea.eth",
	"entach.linea.eth",
	"linous.linea.eth",
	"sueme.linea.eth",
	"verwaa34.linea.eth",
	"alsh.linea.eth",
	"aguskar.linea.eth",
	"1x7.linea.eth",
	"153553.linea.eth",
];
