import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";

import { accounts } from "~~/server/db/schema/accounts";
import { profileLinks } from "~~/server/db/schema/profiles";

export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event);
	const db = useDb(event);

	const body = await readBody(event);

	const existingLink = await db
		.select()
		.from(profileLinks)
		.where(
			and(
				eq(profileLinks.profileId, identity.profileId),
				eq(profileLinks.type, "beam"),
			),
		)
		.limit(1);

	if (!existingLink) {
		throw createError({
			statusCode: 404,
			statusMessage: "Beam account not linked",
		});
	}

	await db.delete(profileLinks).where(
		and(
			eq(profileLinks.profileId, identity.profileId),
			eq(profileLinks.type, "beam"),
		),
	);

	return {
		status: "ok",
	};
});
