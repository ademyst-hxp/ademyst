import type { H3Event } from "h3";

import { createDb } from "#server/db";
import { eq } from "drizzle-orm/sql/expressions/conditions";

import { profiles } from "~~/server/db/schema/profiles";

import { useStorage } from "~~/server/utils/drive";

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const name = event.context.params?.name;

		if (!name) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing username",
			});
		}

		const [profile] = await db
			.select({
				id: profiles.id,
			})
			.from(profiles)
			.where(eq(profiles.name, name))
			.limit(1);

		if (!profile) {
			throw createError({
				statusCode: 404,
				statusMessage: "User not found",
			});
		}

		const storage = useStorage(event, 'avatars');

		const avatarKey = `${profile.id}.webp`;

		if (!(await storage.exists(avatarKey))) {
			return sendRedirect(event, "/images/default_avatar.png", 302);
		}

		const url = await storage.signedUrl(avatarKey, {
			expiresIn: 60 * 60,
		});

		return sendRedirect(event, url, 302);
	} finally {
		await client.end();
	}
});
