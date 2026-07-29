import type { H3Event } from "h3";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as accountsSchema from "./schema/accounts";
import * as profilesSchema from "./schema/profiles";
import * as interactionsSchema from "./schema/interactions";
import * as relationsSchema from "./schema/relations";

const schema = {
	...accountsSchema,
	...profilesSchema,
	...interactionsSchema,
	...relationsSchema,
};

type Database = ReturnType<typeof createDb>;

function createDb(connectionString: string) {
	const client = postgres(connectionString, {
		prepare: false,
	});

	return drizzle(client, {
		schema,
	});
}

let db: Database | undefined;

export function useDb(event: H3Event): Database {
	if (db) {
		return db;
	}

	// Cloudflare Pages / Production
	const hyperdriveUrl =
		event.context.cloudflare?.env?.HYPERDRIVE?.connectionString;

	// Local development
	const databaseUrl = process.env.DATABASE_URL;

	const connectionString = hyperdriveUrl ?? databaseUrl;

	if (!connectionString) {
		throw new Error(
			"No database connection found (HYPERDRIVE or DATABASE_URL)",
		);
	}

	db = createDb(connectionString);

	return db;
}
