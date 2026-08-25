import { eq } from "drizzle-orm/sql/expressions/conditions";

import { useDb } from "#server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { accountModificationHistory } from "~~/server/db/schema/accounts";

import { getIdentity } from "#server/utils/auth";

const validatePayload = (
	payload: any,
): {
	name?: string;
	displayName?: string;
	bio?: string;
	location?: string;
	corporation?: string;
} => {
	if (typeof payload !== "object" || payload === null) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const { name, displayName, bio, location, corporation } = payload;

	if (
		(name !== undefined && typeof name !== "string") ||
		(displayName !== undefined && typeof displayName !== "string") ||
		(bio !== undefined && typeof bio !== "string") ||
		(location !== undefined && typeof location !== "string") ||
		(corporation !== undefined && typeof corporation !== "string")
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const trimmedName = name?.trim();

	if (trimmedName && !/^[a-zA-Z0-9_]{3,16}$/.test(trimmedName)) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Invalid username. It must be 3-16 characters long and can only contain letters, numbers, and underscores.",
		});
	}

	if (displayName && displayName.trim().length > 32) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Display name is too long. It must be 32 characters or less.",
		});
	}

	if (bio && bio.trim().length > 256) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Bio is too long. It must be 256 characters or less.",
		});
	}

	if (location && location.trim().length > 64) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Location is too long. It must be 64 characters or less.",
		});
	}

	return {
		name: name?.trim(),
		displayName: displayName?.trim(),
		bio: bio?.trim(),
		location: location?.trim(),
		corporation: corporation?.trim(),
	};
};

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const name = event.context.params?.name;

	const entries = await readBody(event);
	const payload = validatePayload(entries);

	const identity = await getIdentity(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

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

	if (profile.accountId !== identity.accountId) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are not authorized to update this profile",
		});
	}

	await db.update(profiles).set(payload).where(eq(profiles.id, profile.id));

	if (payload.name) {
	}

	return {
		status: "ok",
	};
});
