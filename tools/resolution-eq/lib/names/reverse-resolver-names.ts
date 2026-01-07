/**
 * The following names are
 *  a) unexpired
 *  b) reverse names
 *  b) using specific well-known Default Reverse Resolvers
 * as of a query on 2026-01-06.
 *
 * -- Count of .addr.reverse domains with non-expired resolved names, grouped by resolver
 * SELECT
 *     rr.resolver,
 *     COUNT(*) AS count
 * FROM "alphaSchema1.3.1".subgraph_domains d
 * INNER JOIN "alphaSchema1.3.1".resolver_records rr ON d.id = rr.node
 * INNER JOIN "alphaSchema1.3.1".subgraph_domains resolved ON rr.name = resolved.name
 * WHERE d.name LIKE '%.addr.reverse'
 *   AND rr.name IS NOT NULL
 *   AND resolved.expiry_date > EXTRACT(EPOCH FROM NOW())
 * GROUP BY rr.resolver
 * ORDER BY count DESC;
 *
 */
export const REVERSE_RESOLVER_NAMES = [
	//////////////////////////
	// DefaultReverseResolver1 (0xa2c122be93b0074270ebee7f6b7292c7deb45047)
	// Need to do a special query here because this reverse resolver doesn't publish events, so we have
	// no data for these to make sure the names they point to are unexpired, so we just grabbed
	// some random ones here.
	//
	// 	SELECT *
	// FROM "alphaSchema1.3.1".subgraph_domains d
	// WHERE d.parent_id = '0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2'
	//   AND d.name NOT LIKE '[%'
	//   AND d.resolver_id LIKE '%0xa2c122be93b0074270ebee7f6b7292c7deb45047%'
	// LIMIT 30;
	//////////////////////////
	"8bdeeb0f31e7133f82c468070bd91be1e9a0c44a.addr.reverse",
	"e120e40cfc8734d0172376d1ce9c276eff760d37.addr.reverse",
	"60583563d5879c2e59973e5718c7de2147971807.addr.reverse",
	"6c3d04aa217e2e51cb576d294ca87d746c21b60e.addr.reverse",
	"28efc475407922eec194d2c362b6566a654f0159.addr.reverse",
	"c53f93394ad911b1e8692d21eaad09943678c65a.addr.reverse",
	"d809d7e040fe8fea0ed21ac695166acfba275f11.addr.reverse",
	"bc3ab75a822f0bb54c22aafed0f03cfe29fd6ec4.addr.reverse",
	"a386621f99d2b74de33051cd5a5d00967668afdd.addr.reverse",
	"a76c25109b1507a8ed90447fa44358dd2354546a.addr.reverse",
	"594ca7df4e39abb9c4caada47b66fd63fc675d2e.addr.reverse",
	"cc9b40755d503aa57703939967617e50ad827efa.addr.reverse",
	"7b8a4e6d36b17a8456bbaf25adc340ea322a4670.addr.reverse",
	"2469a4d280b5622e6ee4dfdbf7ea5f0d8804bda9.addr.reverse",
	"4059e94f431b2c48373c3cf962b257b7a4b1dc63.addr.reverse",
	"ab819d3a805c6b9656f79394a05a4854b5f6cd32.addr.reverse",
	"df186518a6907d85fbb72b7ead85e185d3bd94b5.addr.reverse",
	"2e3876760a561d030111466625ace09d7cb129f0.addr.reverse",
	"418ea8e4ab433ae27390874a467a625f65f131b8.addr.reverse",
	"f1fc45690d624e1e3f8bfcd6ab20d45c81b9d9fd.addr.reverse",
	"abeda15d316bc969ea54797e461be8b9d1450b6f.addr.reverse",
	"af26599f093ccf95350d74df1631b44eb613b0d6.addr.reverse",
	"315b078208d4bfb1eafbd1bdcc985bc00befc4ce.addr.reverse",
	"b87aca45a1946a59deff6762277c1e186ffcc45a.addr.reverse",
	"8e0977ce01394173a793697a0a642f562774b743.addr.reverse",
	"723583e6813fa55525fed188b4282bcc5ebfaeca.addr.reverse",
	"8c0d3ae1f5b7b6eab94145ca50a0ecab8a26c6a7.addr.reverse",
	"33af1be195ea8bec88b5f85875ab576c20f9dc47.addr.reverse",
	"e6165bff46cff439b67dd7aac94e74862774daee.addr.reverse",
	"13686046c2ff821613824db134091f42f0406347.addr.reverse",

	//////////////////////////
	// DefaultReverseResolver2 (0x231b0ee14048e9dccd1d247744d114a4eb5e8e63)
	//////////////////////////
	"ab4f80ba012a3140fdb33cbc491803320bda7021.addr.reverse",
	"b2bbfc949122e46f7213fddfc9c2bf6c4520b0a5.addr.reverse",
	"b8f64379d5f3d05579bbd8c2c2faa03a71cb07a1.addr.reverse",
	"3ad728897be9d4b83e77e76007e4cfdadbd495e1.addr.reverse",
	"5d1c9cff73c8217c2ab5ff37c3db087094226274.addr.reverse",
	"5f5ca4f459ca14e6ccbe073da112314d85481f19.addr.reverse",
	"53e456203756dc72205c21bd5a012f28d85f2f4d.addr.reverse",
	"c122970cf1a71030c9065a2129b06bc934243844.addr.reverse",
	"99380d3d59b959d87dccde4937973ac00f1dde2c.addr.reverse",
	"2a4e0b6e5b4449c5d796d39e87e181f9ff16ac88.addr.reverse",

	//////////////////////////
	// DefaultPublicResolver3 (0xf29100983e058b709f3d539b0c765937b804ac15)
	//////////////////////////
	"a002d299b6d01061a13e8b38cc3bc7ac4946eef8.addr.reverse",
	"1872e19ee46cc531be1d9eaa54a5ea2ec33fe11a.addr.reverse",
	"a6831f79ffe4343333682d55d41da8ccc244a41c.addr.reverse",
	"acf4a426ed4f0808349fab25d4da64394b7ee100.addr.reverse",
	"40f45d1dc16071516e12efa438e0c13488c0fffe.addr.reverse",
	"43d4843629e3f101cfef444ef6921c5c2b84d310.addr.reverse",
	"492d5434f4a55357816c3ba44e3453e866e60e52.addr.reverse",
	"0000001cf4b4167b97cc8267c4f9fb4fda7d6c16.addr.reverse",
	"3a5b8c39de7956d7bc3fd86b9de5f013edf4bc66.addr.reverse",
	"6c8a4b501108161ecb6f8d861b2cd008867a35da.addr.reverse",
];
