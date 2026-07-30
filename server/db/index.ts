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

// Cloudflare Workers can't reuse I/O objects (sockets) across requests, so the
// db client must be created fresh per request instead of cached at module scope.
const dbByEvent = new WeakMap<H3Event, Database>();

export function useDb(event: H3Event): Database {
	const cached = dbByEvent.get(event);

	if (cached) {
		return cached;
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

	const { client, db } = createDb(connectionString);

	// Release the connection once this request's queries are done, instead of
	// leaking it — otherwise repeated requests exhaust Hyperdrive's pool since
	// each request opens its own fresh connection (see WeakMap comment above).
	event.waitUntil(client.end());

	dbByEvent.set(event, db);

	return db;
}
