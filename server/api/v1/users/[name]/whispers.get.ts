import type { H3Event } from "h3";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import { desc } from "drizzle-orm/sql/expressions/select";

import { profiles } from "~~/server/db/schema/profiles";
import { whispers } from "~~/server/db/schema/interactions";

import { getRelationshipStatus } from "~~/server/utils/helpers/privacy";

import { getIdentity } from "#server/utils/auth";
import { retrieveCleanWhisper } from "~~/server/utils/converters/interactions";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);

	const name = event.context.params?.name;
	const limit = Number(event.context.query?.limit) || 100;
	const offset = Number(event.context.query?.offset) || 0;

	if (limit > 100) {
		throw createError({
			statusCode: 400,
			statusMessage: "Limit cannot exceed 100",
		});
	}

	if (offset < 0) {
		throw createError({
			statusCode: 400,
			statusMessage: "Offset cannot be negative",
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

	const relationships = await getRelationshipStatus(
		event,
		identity,
		profile,
	);

	if (relationships.blocked) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are blocked from viewing this profile",
		});
	}

	const dbWhispers = await db
		.select()
		.from(whispers)
		.where(eq(whispers.profileId, profile.id))
		.orderBy(desc(whispers.createdAt))
		.limit(limit)
		.offset(offset);

	const _whispers = await Promise.all(
		dbWhispers.map(async (whisper) =>
			retrieveCleanWhisper(event, identity, whisper),
		),
	);

	return {
		status: "ok",
		whispers: _whispers,
		next: offset + limit,
		hasNext: dbWhispers.length === limit,
	};
});
