import type { H3Event } from "h3";

import { createDb } from "#server/db";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";

import { profiles } from "~~/server/db/schema/profiles";
import { follows, requests } from "~~/server/db/schema/relations";

import {
	getRelationshipStatus,
	getPrivacySettings,
	canAccess,
} from "~~/server/utils/helpers/privacy";

import { requireAuth } from "~~/server/utils/middleware/auth";

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
			? await getRelationshipStatus(event, identity, profile)
			: {
					me: false,
					following: false,
					followed: false,
					friend: false,
					friended: false,
					blocking: false,
					blocked: false,
				};

		if (relationships.blocked) {
			throw createError({
				statusCode: 403,
				statusMessage: "This profile is private",
			});
		}

		const privacy = await getPrivacySettings(event, profile);
		const access = canAccess(privacy, relationships);

		if (relationships.following) {
			setResponseStatus(event, 204);

			return {
				status: "ok",
				message: "Already following this user",
			};
		}

		// Init the request to follow the user, or send a follow request if the user's profile is private
		const [request] = await db
			.select()
			.from(requests)
			.where(
				and(
					eq(requests.senderId, identity.profileId as string),
					eq(requests.receiverId, profile.id),
				),
			)
			.limit(1);

		if (request) {
			setResponseStatus(event, 204);

			return {
				status: "ok",
				message: "Follow request already sent",
			};
		}

		if (access.profile) {
			await db.insert(follows).values({
				followerId: identity.profileId as string,
				followingId: profile.id,
			});

			return {
				status: "ok",
				message: "Now following this user",
			};
		} else {
			const result = await db.insert(requests).values({
				senderId: identity.profileId as string,
				receiverId: profile.id,
			});

			if (result) {
				return {
					status: "ok",
					message: "Follow request sent",
				};
			}

			throw createError({
				statusCode: 500,
				statusMessage: "Failed to send follow request",
			});
		}
	} finally {
		await client.end();
	}
});
