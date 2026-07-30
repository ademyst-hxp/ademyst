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

// Kept separately so the connection can be closed after the response is sent
// (see closeDb below) — calling client.end() closes it for *new* queries
// immediately, so it must only happen once this request's queries are done.
const clientByEvent = new WeakMap<H3Event, ReturnType<typeof postgres>>();

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

	dbByEvent.set(event, db);
	clientByEvent.set(event, client);

	return db;
}

// Called from the "afterResponse" nitro hook (server/plugins/close-db.ts),
// once this request's queries have all completed.
export function closeDb(event: H3Event): void {
	const client = clientByEvent.get(event);

	if (client) {
		event.waitUntil(client.end());
	}
}
