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

type Database = ReturnType<typeof createDb>["db"];

function createDb(connectionString: string) {
	const client = postgres(connectionString, {
		prepare: false,
		max: 5,
		fetch_types: false,
	});

	return {
		client,
		db: drizzle(client, {
			schema,
		}),
	};
}

// One database client per HTTP request.
// The same client is reused for every SQL query during that request.
const dbByEvent = new WeakMap<H3Event, Database>();

export function useDb(event: H3Event): Database {
	const cached = dbByEvent.get(event);

	if (cached) {
		return cached;
	}

	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error("No database connection found (DATABASE_URL)");
	}

	const { db } = createDb(connectionString);

	dbByEvent.set(event, db);

	return db;
}
