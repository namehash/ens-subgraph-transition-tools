import { sql } from "bun";

export async function clusterPonderSchema() {
	if (!process.env.DATABASE_URL) {
		console.log(
			"No DATABASE_URL provided, will not CLUSTER tables, snapshotting may be very slow.",
		);
		return;
	}

	await sql`
    -- Function to generate and execute CLUSTER commands for public tables
    CREATE OR REPLACE FUNCTION cluster_all_tables() RETURNS void AS $$
    DECLARE
        table_record record;
        table_name text;
        primary_index text;
        cluster_command text;
    BEGIN
        -- Loop through tables in public schema only
        FOR table_record IN
            SELECT
                c.relname as table_name,
                (SELECT ci.relname
                FROM pg_class ci
                WHERE ci.oid = i.indexrelid) as index_name
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            -- Join with pg_index to get primary key indexes
            JOIN pg_index i ON i.indrelid = c.oid
            WHERE
                -- Regular tables only
                c.relkind = 'r'
                -- Only public schema
                AND n.nspname = 'public'
                -- Exclude tables starting with underscore
                AND c.relname NOT LIKE '\_%'
                -- Primary key indexes only
                AND i.indisprimary
            ORDER BY c.relname
        LOOP
            table_name := table_record.table_name;
            primary_index := table_record.index_name;

            IF primary_index IS NOT NULL AND primary_index != '' THEN
                -- Build and execute CLUSTER command
                cluster_command := format('CLUSTER %I USING %I',
                                        table_name,
                                        primary_index);

                RAISE NOTICE 'Executing: %', cluster_command;

                -- Execute the CLUSTER command
                EXECUTE cluster_command;

                -- Log completion
                RAISE NOTICE 'Clustered table % using index %',
                            table_name,
                            primary_index;
            ELSE
                RAISE NOTICE 'Skipping table % - no valid primary key index found',
                            table_name;
            END IF;
        END LOOP;

        RAISE NOTICE 'All public tables have been clustered successfully.';
    END;
    $$ LANGUAGE plpgsql;
  `;

	console.log(`CLUSTERING 'public' tables...`);
	await sql`SELECT cluster_all_tables();`;
	console.log("↳ done");
}
