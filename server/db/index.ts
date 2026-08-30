import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as accountsSchema from "~~/server/db/schema/accounts";
import * as profilesSchema from "~~/server/db/schema/profiles";
import * as interactionsSchema from "~~/server/db/schema/interactions";
import * as relationsSchema from "~~/server/db/schema/relations";

const schema = {
	...accountsSchema,
	...profilesSchema,
	...interactionsSchema,
	...relationsSchema,
};

export function createDb() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error("DATABASE_URL is not defined");
	}

	const client = postgres(connectionString, {
		prepare: false,
		fetch_types: false,
		max: 1,
	});

	const db = drizzle(client, {
		schema,
	});

	return {
		db,
		client,
	};
}
