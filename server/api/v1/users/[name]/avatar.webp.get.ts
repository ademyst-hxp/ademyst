import type { H3Event } from "h3";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm/sql/expressions/conditions";

import { profiles } from "~~/server/db/schema/profiles";

import { useDrive } from "~~/server/utils/drive";

export default defineEventHandler(async (event: H3Event) => {
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

	const storage = useDrive(event, 'avatars');

	const avatarKey = `${profile.id}.webp`;

	// Lets the browser reuse the redirect (and so the image behind it)
	// instead of hitting the database and the bucket for every <img>. Kept
	// well under the signed URL lifetime; a new avatar shows up within it.
	// Only set on the redirects themselves so an error is never cached.
	const redirect = (location: string) => {
		setResponseHeader(event, "Cache-Control", "private, max-age=300");

		return sendRedirect(event, location, 302);
	};

	if (!(await storage.exists(avatarKey))) {
		return redirect("/images/default_avatar.png");
	}

	const url = await storage.signedUrl(avatarKey, {
		expiresIn: 60 * 60,
	});

	return redirect(url);
});
