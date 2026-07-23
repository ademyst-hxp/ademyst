import { eq } from "drizzle-orm/sql/expressions/conditions";

import { db } from "#server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { follows } from "~~/server/db/schema/relations";

import {
	getRelationshipStatus,
	getPrivacySettings,
	canAccess,
} from "~~/server/utils/helpers/privacy";

import { getIdentity } from "#server/utils/auth";
import { retrieveCleanProfile } from "~~/server/utils/converters/profiles";

export default defineEventHandler(async (event) => {
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
	const privacy = await getPrivacySettings(profile);
	const access = await canAccess(privacy, relationships);

	if (!access.profile) {
		setResponseStatus(event, 206);

		return {
			status: "partial",
			followers: [],
		};
	}

	const followers = await db
		.select({
			profile: profiles,
		})
		.from(follows)
		.innerJoin(profiles, eq(profiles.id, follows.followerId))
		.where(eq(follows.followingId, profile.id))
		.limit(limit)
		.offset(offset);

	return {
		status: "ok",
		followers: followers.map(({ profile }) =>
			retrieveCleanProfile(identity, profile),
		),
		next: offset + limit,
		hasNext: followers.length === limit,
	};
});
