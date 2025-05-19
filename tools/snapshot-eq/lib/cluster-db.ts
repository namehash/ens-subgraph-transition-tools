import { Client } from "pg";

export async function clusterPonderSchema() {
	if (!process.env.DATABASE_URL) {
		console.log(
			"No DATABASE_URL provided, will not CLUSTER tables, snapshotting may be very slow.",
		);
		return;
	}

	// Initialize the PostgreSQL client
	const client = new Client({ connectionString: process.env.DATABASE_URL });

	try {
		// Connect to the database
		await client.connect();
		console.log("Successfully connected to the database.");

		// Listen for NOTICE and WARNING messages from PostgreSQL
		// This is crucial for seeing what the cluster_all_tables function is doing
		client.on("notice", (msg) => {
			// msg is an object with properties like 'message', 'severity', 'code', etc.
			if (msg.severity === "WARNING") {
				console.warn(`PostgreSQL WARNING: ${msg.message}`);
			} else {
				console.log(`PostgreSQL Notice: ${msg.message}`);
			}
		});

		console.log("Creating or replacing cluster_all_tables function...");
		// Define the PostgreSQL function to cluster tables
		await client.query(`
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
                        AND LEFT(c.relname, 1) <> '_'             -- Exclude tables starting with underscore (more robust check)
                        AND i.indisprimary                        -- Primary key indexes only
                    ORDER BY c.relname
                LOOP
                    table_name_ident := table_record.table_name;
                    index_name_ident := table_record.index_name;

                    -- Check if a primary key index was found
                    IF index_name_ident IS NOT NULL AND index_name_ident <> '' THEN
                        -- Build the CLUSTER command using format() for safe identifier quoting
                        -- Explicitly qualify table with public schema for clarity, though CLUSTER typically works on search_path
                        cluster_command := format('CLUSTER public.%I USING %I',
                                                table_name_ident,
                                                index_name_ident);

                        RAISE NOTICE 'Attempting to execute: %', cluster_command;

                        -- Execute the CLUSTER command with its own exception block
                        -- This allows the function to continue if one CLUSTER fails
                        BEGIN
                            EXECUTE cluster_command;
                            RAISE NOTICE 'Successfully clustered table public.%I using index %I',
                                        table_name_ident,
                                        index_name_ident;
                        EXCEPTION
                            WHEN OTHERS THEN
                                -- If CLUSTER fails (e.g., lock timeout, permissions, transaction issue),
                                -- log a warning with details and continue to the next table.
                                RAISE WARNING 'Failed to CLUSTER table public.%I using index %I. SQLSTATE: %, SQLERRM: %',
                                            table_name_ident,
                                            index_name_ident,
                                            SQLSTATE, -- PostgreSQL error code
                                            SQLERRM;  -- PostgreSQL error message
                        END;
                    ELSE
                        -- This case should ideally not be hit if the main query correctly selects tables with PKs.
                        -- If it is, it means a table was selected but its index_name was missing.
                        RAISE NOTICE 'Skipping table public.%I - no valid primary key index name found after selection.',
                                    table_name_ident;
                    END IF;
                END LOOP;

                RAISE NOTICE 'Finished attempting to cluster all applicable public tables.';
            END;
            $$ LANGUAGE plpgsql;
        `);
		console.log("Function cluster_all_tables created/replaced successfully.");

		// Execute the function
		console.log("Calling cluster_all_tables() to CLUSTER 'public' tables...");
		const startTime = performance.now();
		await client.query("SELECT cluster_all_tables();"); // This will trigger notices

		const duration = ((performance.now() - startTime) / 1000).toFixed(2);
		console.log(`↳ CLUSTER operation attempt finished. Duration: ${duration}s`);
		console.log(
			"Review the 'PostgreSQL Notice:' and 'PostgreSQL WARNING:' messages above for details on each table.",
		);
	} catch (error) {
		// Catch any errors from client.connect(), client.query(), etc.
		console.error("Error during clustering process:", error);
	} finally {
		// Ensure the client connection is closed
		if (client) {
			await client.end();
			console.log("Database connection closed.");
		}
	}
}

// Example of how to run it (ensure DATABASE_URL is set in your environment)
// clusterPonderSchema().catch(console.error);
