import { createError, type H3Event } from "h3";

import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";

import { postReactions, posts } from "#server/db/schema/interactions";
import { postNotifications } from "#server/db/schema/inbox";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event: H3Event) => {
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
		const [post] = await tx
			.select({ profileId: posts.profileId })
			.from(posts)
			.where(eq(posts.id, postId))
			.limit(1);

		if (!post) {
			throw createError({
				statusCode: 404,
				statusMessage: "Post not found",
			});
		}

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

		await tx
			.delete(postNotifications)
			.where(
				and(
					eq(postNotifications.postId, postId),
					eq(postNotifications.issuerId, identity.profileId),
					eq(postNotifications.type, "reaction"),
				),
			);

		if (post.profileId !== identity.profileId) {
			await tx.insert(postNotifications).values({
				profileId: post.profileId,
				issuerId: identity.profileId,
				postId,
				type: "reaction",
			});
		}
	});

	return { status: "ok", liked: true };
});
