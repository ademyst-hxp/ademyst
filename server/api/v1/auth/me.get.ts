import { useDb } from "#server/db";
import { profiles } from "#server/db/schema/profiles";
import { eq } from "drizzle-orm";

import { triggerQuests } from "~~/server/jobs/campaigns/christmas";
import { requireAuth } from "#server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

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

	// Quête de Noël : jour de grève (14), validée par la simple connexion
	await triggerQuests(event, identity.profileId, [14]);

	const profile = await retrieveCleanProfile(event, identity, _profile);

	return {
		claims: identity,
		profile,
	};
});
