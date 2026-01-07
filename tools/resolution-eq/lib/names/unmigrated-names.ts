/**
 * The following names are
 *  a) unexpired, and
 *  b) unmigrated (only registered in the ENSv1 RegistryOld, not the Registry),
 * as of a query on 2026-01-06.
 *
 * SELECT
 *     a.name,
 *     d.id AS node,
 *     d.owner_id,
 *     d.expiry_date,
 *     d.created_at,
 *     to_timestamp(d.expiry_date::bigint) AS expiry_timestamp,
 *     to_timestamp(d.created_at::bigint) AS created_timestamp
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
 * LEFT JOIN "alphaSchema1.3.1".migrated_nodes m ON d.id = m.node
 * WHERE m.node IS NULL
 *   AND d.expiry_date > EXTRACT(EPOCH FROM NOW())
 *   AND a.name LIKE '%.eth'
 *   AND a.name NOT LIKE '%.base.eth'
 *   AND a.name NOT LIKE '%.linea.eth'
 * ORDER BY d.created_at ASC
 * LIMIT 10;
 */
export const UNMIGRATED_NAMES = ["takoyaki.eth"];
