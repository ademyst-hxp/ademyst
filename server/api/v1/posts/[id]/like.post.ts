import { and, eq } from "drizzle-orm";
import { createError } from "h3";

import { useDb } from "#server/db";
import { postReactions } from "#server/db/schema/interactions";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(postReactions)
			.where(
				and(
					eq(postReactions.postId, postId),
					eq(postReactions.profileId, identity.profileId),
				),
			);

		await tx.insert(postReactions).values({
			postId,
			profileId: identity.profileId,
			reaction: "like",
		});
	});

	return { status: "ok", liked: true };
});
