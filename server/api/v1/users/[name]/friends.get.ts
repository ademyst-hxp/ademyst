import { eq } from "drizzle-orm/sql/expressions/conditions";

import { useDb } from "#server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { friendships } from "~~/server/db/schema/relations";

import {
	getRelationshipStatus,
} from "~~/server/utils/helpers/privacy";

import { getIdentity } from "#server/utils/auth";
import { retrieveCleanProfile } from "~~/server/utils/converters/profiles";

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

	if (!relationships.me) {
		setResponseStatus(event, 206);

		return {
			status: "partial",
			friends: [],
			next: offset,
			hasNext: false
		};
	}

	const friends = await db
		.select({
			friend: profiles,
		})
		.from(friendships)
		.innerJoin(profiles, eq(profiles.id, friendships.profileBId))
		.where(eq(friendships.profileAId, profile.id))
		.limit(limit)
		.offset(offset);

	const _friends = await Promise.all(
		friends.map(async ({ friend }) => {
			return retrieveCleanProfile(identity, friend);
		}),
	);

	return {
		status: "ok",
		friends: _friends,
		next: offset + limit,
		hasNext: _friends.length === limit,
	};
});
