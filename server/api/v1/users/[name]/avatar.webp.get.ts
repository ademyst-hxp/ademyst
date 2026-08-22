import { eq } from "drizzle-orm/sql/expressions/conditions";

import { useDb } from "#server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { useDrive } from "~~/server/utils/drive";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

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

	const drive = useDrive(event);

	const avatarKey = `${profile.id}.webp`;

	if (!(await drive.exists("avatars", avatarKey))) {
		return sendRedirect(event, "/images/default_avatar.png", 302);
	}

	const url = await drive.signedUrl("avatars", avatarKey, {
		expiresIn: 60 * 60,
	});

	return sendRedirect(event, url, 302);
});
