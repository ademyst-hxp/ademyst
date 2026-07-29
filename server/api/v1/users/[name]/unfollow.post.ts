import { and, eq } from "drizzle-orm/sql/expressions/conditions";

import { useDb } from "#server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { requests, follows, friendships } from "~~/server/db/schema/relations";

import { getRelationshipStatus } from "~~/server/utils/helpers/privacy";

import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const name = event.context.params?.name;

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

	if (!relationships.following) {
		setResponseStatus(event, 204);

		return {
			status: "ok",
			message: "Not following this user",
		};
	}

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

	let any_action: boolean = false;

	if (request) {
		await db.delete(requests).where(eq(requests.id, request.id));
		any_action = true;
	}

	if (relationships.following) {
		await db
			.delete(follows)
			.where(
				and(
					eq(follows.followerId, identity.profileId as string),
					eq(follows.followingId, profile.id),
				),
			);

		any_action = true;
	}

	if (relationships.friend) {
		await db
			.delete(friendships)
			.where(
				and(
					eq(friendships.profileAId, identity.profileId as string),
					eq(friendships.profileBId, profile.id),
				),
			);

		any_action = true;
	}

	if (!any_action) {
		setResponseStatus(event, 204);

		return {
			status: "ok",
			message: "Not following this user",
		};
	} else {
		return {
			status: "ok",
			message: "Unfollowed user successfully",
		};
	}
});
