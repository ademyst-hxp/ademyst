import { useDb } from "#server/db";
import { whispers } from "~~/server/db/schema/interactions";
import { eq } from "drizzle-orm/sql/expressions/conditions";

import { useDrive } from "~~/server/utils/drive";

import type { H3Event } from "h3";
import { profiles } from "~~/server/db/schema/profiles";

const validateId = (id: string | undefined): id is string => {
	if (!id) {
		return false;
	}

	if (typeof id !== "string") {
		return false;
	}

	if (!/^[a-fA-F0-9]{10}$/.test(id)) {
		return false;
	}

	return true;
};

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const id = event.context.params?.id;

	if (!validateId(id)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid ID",
		});
	}

	const [whisper] = await db
		.select()
		.from(whispers)
		.where(eq(whispers.id, id))
		.limit(1);

	if (!whisper) {
		throw createError({
			statusCode: 404,
			statusMessage: "Whisper not found",
		});
	}

	// Check relationship between whisper and profile
	const identity = await getIdentity(event);

	const [author] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, whisper.profileId))
		.limit(1);

	if (!author) {
		throw createError({
			statusCode: 404,
			statusMessage: "Author not found",
		});
	}

	const relationship = await getRelationshipStatus(event, identity, author);
	const privacy = await getPrivacySettings(event, author);
	const access = canAccessEntity(privacy, relationship, whisper.visibility);

	if (!access) {
		throw createError({
			statusCode: 403,
			statusMessage: "This wisper is private.",
		});
	}

	// Check if the background exists
	const storage = useDrive(event, "files");
	const backgroundKey = `/whispers/${whisper.id}.webp`;

	// Lets the browser reuse the redirect (and so the image behind it)
	// instead of hitting the database and the bucket for every <img>. Kept
	// well under the signed URL lifetime; a new avatar shows up within it.
	// Only set on the redirects themselves so an error is never cached.
	const redirect = (location: string) => {
		setResponseHeader(event, "Cache-Control", "private, max-age=300");

		return sendRedirect(event, location, 302);
	};

	if (!(await storage.exists(backgroundKey))) {
		throw createError({
			statusCode: 404,
			statusMessage: "Background not found",
		});
	}

	const url = await storage.signedUrl(backgroundKey, {
		expiresIn: 60 * 60,
	});

	return redirect(url);
});
