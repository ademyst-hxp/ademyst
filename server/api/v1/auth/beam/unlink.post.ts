import { createDb } from "#server/db";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";

import { profileLinks } from "~~/server/db/schema/profiles";

export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event);
	const { db, client } = createDb();

	try {
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

		await db
			.delete(profileLinks)
			.where(
				and(
					eq(profileLinks.profileId, identity.profileId),
					eq(profileLinks.type, "beam"),
				),
			);

		return {
			status: "ok",
		};
	} finally {
		await client.end();
	}
});
