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
	//////////////////////////
	// Linea Names
	//////////////////////////
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

	//////////////////////////
	// Linea Default Reverse Resolver (0x86c5aed9f27837074612288610fb98ccc1733126)
	//////////////////////////
	"3b410ff9c37bc464be428d45c47ae8fceda3419a.addr.reverse",
	"c49534e61947e2de59242109ede06f2a3e08c33c.addr.reverse",
	"5458d062b2dc7056e0692f8bc33c736919906e0f.addr.reverse",
	"535c9f2ffd08a687f9c4087546eac8a7b077e614.addr.reverse",
	"2f1aaf2679cf6e31018280f7285f67ea92382934.addr.reverse",
	"52460be8521a8a3ad20d11d737e813a8ecb2a202.addr.reverse",
	"59c3bccae50c0664d66efda1c340185d66634930.addr.reverse",
	"560626a054ba0d7853784b1f6c3e706d56f1fb5c.addr.reverse",
	"5019fd9d033d5b6e1cd86c9a56376c72bee7a46c.addr.reverse",
	"e11e87a71084fa6b59eadfca92d68202495c6507.addr.reverse",
];
