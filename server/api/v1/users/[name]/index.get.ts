import { eq } from "drizzle-orm/sql/expressions/conditions";

import { createDb } from "#server/db";
import { profiles } from "~~/server/db/schema/profiles";

import { getIdentity } from "#server/utils/auth";
import { retrieveCleanProfile } from "~~/server/utils/converters/profiles";

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const name = event.context.params?.name;

		const identity = await getIdentity(event);

		if (!name) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing username",
			});
		}

		const [profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.name, name))
			.limit(1);

		if (!profile) {
			throw createError({
				statusCode: 404,
				statusMessage: "User not found",
			});
		}

		const data = await retrieveCleanProfile(event, identity, profile);

		return {
			status: "ok",
			profile: data,
		};
	} finally {
		await client.end();
	}
});
