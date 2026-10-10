import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { H3Event } from "h3";

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

function createDb() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error("DATABASE_URL is not defined");
	}

	const client = postgres(connectionString, {
		prepare: false,
		fetch_types: false,
		max: 1,
		// Safety net: the connection is closed by server/plugins/db.ts once the
		// response is sent, this only covers a request that never completes.
		idle_timeout: 20,
	});

	const db = drizzle(client, {
		schema,
	});

	return {
		db,
		client,
	};
}

type DbInstance = ReturnType<typeof createDb>;

export type DbTransaction = Parameters<
	Parameters<DbInstance["db"]["transaction"]>[0]
>[0];

declare module "h3" {
	interface H3EventContext {
		db?: DbInstance;
	}
}

// One connection per request, shared by the handler and every helper it
// calls. Opening a Postgres connection costs a TCP + TLS + auth handshake,
// and Workers cap a request at 6 simultaneous connections, so helpers must
// never open their own.
export function useDb(event: H3Event): DbInstance["db"] {
	event.context.db ??= createDb();

	return event.context.db.db;
}

export function closeDb(event: H3Event) {
	const instance = event.context.db;

	if (!instance) {
		return;
	}

	event.context.db = undefined;

	event.waitUntil(instance.client.end({ timeout: 5 }).catch(() => {}));
}
