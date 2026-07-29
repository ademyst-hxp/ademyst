import { eq } from "drizzle-orm/sql/expressions/conditions";
import { desc } from "drizzle-orm/sql/expressions/select";

import { useDb } from "#server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { statuses } from "~~/server/db/schema/interactions";

import {
	getRelationshipStatus,
} from "~~/server/utils/helpers/privacy";

import { getIdentity } from "#server/utils/auth";
import { retrieveCleanStatus } from "~~/server/utils/converters/interactions";

export default defineEventHandler(async (event) => {
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

	const relationships = await getRelationshipStatus(identity, profile);

	if (relationships.blocked) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are blocked from viewing this profile",
		});
	}

	const dbStatuses = await db
		.select()
		.from(statuses)
		.where(eq(statuses.profileId, profile.id))
		.orderBy(desc(statuses.createdAt))
		.limit(limit)
		.offset(offset);

	const _statuses = await Promise.all(
		dbStatuses.map(async (status) =>
			retrieveCleanStatus(
				identity,
				status,
			),
		),
	);

	return {
		status: "ok",
		statuses: _statuses,
		next: offset + limit,
		hasNext: dbStatuses.length === limit,
	};
});
