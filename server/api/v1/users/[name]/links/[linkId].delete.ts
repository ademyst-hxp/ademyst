import type { H3Event } from "h3";

import { createDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { profiles, profileLinks } from "~~/server/db/schema/profiles";

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const identity = await getIdentity(event);

		const name = event.context.params?.name;
		const id = event.context.params?.linkId;

		if (!name) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing username",
			});
		}

		if (!id) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing link ID",
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

		if (profile.id !== identity?.profileId) {
			throw createError({
				statusCode: 403,
				statusMessage:
					"You are not authorized to add links to this profile",
			});
		}

		const [existingLink] = await db
			.select()
			.from(profileLinks)
			.where(eq(profileLinks.id, id))
			.limit(1);

		if (!existingLink) {
			throw createError({
				statusCode: 404,
				statusMessage: "Link not found",
			});
		}

		await db.delete(profileLinks).where(eq(profileLinks.id, id)).execute();

		return {
			status: "ok",
		};
	} finally {
		await client.end();
	}
});
