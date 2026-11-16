import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { postReactions, posts } from "#server/db/schema/interactions";
import { profiles } from "#server/db/schema/profiles";
import { and, eq } from "drizzle-orm";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";

import { createError } from "h3";
import { type H3Event } from "h3";

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
			.select({ profileId: posts.profileId, accountId: profiles.accountId })
			.from(posts)
			.innerJoin(profiles, eq(profiles.id, posts.profileId))
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
			.delete(notifications)
			.where(
				and(
					eq(notifications.postId, postId),
					eq(notifications.actorId, identity.profileId),
					eq(notifications.type, "interaction.reaction"),
				),
			);

		if (post.profileId !== identity.profileId) {
			await tx.insert(notifications).values({
				accountId: post.accountId,
				profileId: post.profileId,
				actorId: identity.profileId,
				postId,
				type: "interaction.reaction",
				data: { reaction: "like" },
			});
		}
	});

	return { status: "ok", liked: true };
});
