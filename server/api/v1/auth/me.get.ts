import { eq } from "drizzle-orm";

import { createDb } from "#server/db";
import { profiles } from "#server/db/schema/profiles";

import { requireAuth } from "#server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const identity = await requireAuth(event);

		if (!identity) {
			throw createError({
				statusCode: 401,
				statusMessage: "Unauthorized",
			});
		}

		const [_profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, identity.profileId))
			.limit(1);

		if (!_profile) {
			throw createError({
				statusCode: 404,
				statusMessage: "Profile not found",
			});
		}

		const profile = await retrieveCleanProfile(event, identity, _profile);

		return {
			claims: identity,
			profile,
		};
	} finally {
		await client.end();
	}
});
