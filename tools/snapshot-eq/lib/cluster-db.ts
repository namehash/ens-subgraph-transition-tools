import { sql } from "bun";

export async function clusterPonderSchema() {
	if (!process.env.DATABASE_URL) {
		console.log(
			"No DATABASE_URL provided, will not CLUSTER tables, snapshotting may be very slow.",
		);
		return;
	}

	await sql`
        CREATE OR REPLACE FUNCTION cluster_all_tables() RETURNS void AS $$
        DECLARE
            table_record record;
            table_name_ident text; -- For use with format %I
            index_name_ident text; -- For use with format %I
            cluster_command text;
        BEGIN
            -- Loop through tables in public schema that have a primary key
            -- and do not start with an underscore.
            FOR table_record IN
                SELECT
                    c.relname AS table_name, -- Actual table name
                    (SELECT idx_c.relname FROM pg_class idx_c WHERE idx_c.oid = i.indexrelid) AS index_name -- Actual index name
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                JOIN pg_index i ON i.indrelid = c.oid -- i is the pg_index entry for the index
                WHERE
                    c.relkind = 'r'                           -- Regular tables only
                    AND n.nspname = 'public'                  -- Only public schema
                    AND LEFT(c.relname, 1) <> '_'             -- Exclude tables starting with underscore
                    AND i.indisprimary                        -- Primary key indexes only
                ORDER BY c.relname
            LOOP
                table_name_ident := table_record.table_name;
                index_name_ident := table_record.index_name;

                IF index_name_ident IS NOT NULL AND index_name_ident <> '' THEN
                    cluster_command := format('CLUSTER public.%I USING %I',
                                            table_name_ident,
                                            index_name_ident);

                    RAISE NOTICE 'Attempting to execute: %', cluster_command;

                    BEGIN
                        EXECUTE cluster_command;
                        RAISE NOTICE 'Successfully clustered table public.%I using index %I',
                                    table_name_ident,
                                    index_name_ident;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE WARNING 'Failed to CLUSTER table public.%I using index %I. SQLSTATE: %, SQLERRM: %',
                                        table_name_ident,
                                        index_name_ident,
                                        SQLSTATE,
                                        SQLERRM;
                    END;
                ELSE
                    RAISE NOTICE 'Skipping table public.%I - no valid primary key index name found after selection.',
                                table_name_ident;
                END IF;
            END LOOP;
            RAISE NOTICE 'Finished attempting to cluster all applicable public tables.';
        END;
        $$ LANGUAGE plpgsql;
    `;
	console.log("Function cluster_all_tables created/replaced successfully.");

	console.log("Calling cluster_all_tables() to CLUSTER 'public' tables...");
	const startTime = performance.now();
	await sql`SELECT cluster_all_tables();`;

	const duration = ((performance.now() - startTime) / 1000).toFixed(2);
	console.log(`↳ CLUSTER operation attempt finished. Duration: ${duration}s`);
}
