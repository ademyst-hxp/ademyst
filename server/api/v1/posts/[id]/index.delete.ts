import { useDb } from "~~/server/db";
import { posts } from "~~/server/db/schema/interactions";
import { eq } from "drizzle-orm";

import { normalizeId } from "#server/utils/normalizers/ids";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);
	const user = await getUser(event, identity);

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const [candidate] = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.limit(1);

	if (!candidate) {
		throw createError({
			statusCode: 404,
			statusMessage: "Post not found",
		});
	}

	if (!(
		candidate.profileId === user.profile.id || user.profile.level >= 7
	)) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are not authorized to delete this post",
		});
	}

	await db.delete(posts).where(eq(posts.id, postId));

	return {
		status: "ok",
	};
});
