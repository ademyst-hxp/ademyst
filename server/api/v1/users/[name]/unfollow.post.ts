import { useDb } from "#server/db";
import { followNotifications } from "~~/server/db/schema/inbox";
import { profiles } from "~~/server/db/schema/profiles";
import { follows, friendships, requests } from "~~/server/db/schema/relations";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";

import { getRelationshipStatus } from "~~/server/utils/helpers/privacy";
import { requireAuth } from "~~/server/utils/middleware/auth";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
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

	const relationships = await getRelationshipStatus(event, identity, profile);

	if (!relationships.following && !relationships.requesting) {
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

	let anyAction = false;
	const wasRequesting = relationships.requesting;

	if (request) {
		await db.delete(requests).where(eq(requests.id, request.id));
		await db
			.delete(followNotifications)
			.where(
				and(
					eq(followNotifications.profileId, profile.id),
					eq(
						followNotifications.issuerId,
						identity.profileId as string,
					),
					eq(followNotifications.type, "request"),
				),
			);
		anyAction = true;
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

		anyAction = true;
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

		anyAction = true;
	}

	if (!anyAction) {
		setResponseStatus(event, 204);

		return {
			status: "ok",
			message: "Not following this user",
		};
	} else {
		return {
			status: "ok",
			message: wasRequesting
				? "Follow request cancelled"
				: "Unfollowed user successfully",
		};
	}
});
