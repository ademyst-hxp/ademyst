import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { postReactions } from "#server/db/schema/interactions";
import { and, eq } from "drizzle-orm";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);
	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	await db
		.delete(postReactions)
		.where(
			and(
				eq(postReactions.postId, postId),
				eq(postReactions.profileId, identity.profileId),
			),
		);

	await db
		.delete(notifications)
		.where(
			and(
				eq(notifications.postId, postId),
				eq(notifications.actorId, identity.profileId),
				eq(notifications.type, "interaction.reaction"),
			),
		);

	return { status: "ok", liked: false };
});
