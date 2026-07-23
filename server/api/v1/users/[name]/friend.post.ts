import { eq } from "drizzle-orm/sql/expressions/conditions";

import { db } from "#server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { friendships } from "~~/server/db/schema/relations";

import { getRelationshipStatus } from "~~/server/utils/helpers/privacy";
import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const name = event.context.params?.name;

	if (!name) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing username",
		});
	}

	// Get the identity of the user making the request
	const identity = await requireAuth(event, { min_level: 2 });

	// Get the profile of the user to follow
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

	// Check the relationship status between the two users, and the privacy settings of the user to follow
	const relationships = identity
		? await getRelationshipStatus(identity, profile)
		: {
				me: false,
				following: false,
				followed: false,
				friend: false,
				blocked: false,
				friended: false,
				blocking: false,
			};

	if (relationships.blocked) {
		throw createError({
			statusCode: 403,
			statusMessage: "This profile is private",
		});
	}

	if (!relationships.following) {
		throw createError({
			statusCode: 400,
			statusMessage: "Not following this user",
		});
	}

	if (relationships.friend) {
		setResponseStatus(event, 204);

		return {
			status: "ok",
			message: "Already friends with this user",
		};
	}

	await db.insert(friendships).values({
		profileAId: identity.profileId as string,
		profileBId: profile.id,
	});

	return {
		status: "ok",
	};
});
