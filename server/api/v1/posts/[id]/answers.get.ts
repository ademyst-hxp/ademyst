import { useDb } from "~~/server/db";
import { posts } from "~~/server/db/schema/interactions";
import { asc, eq } from "drizzle-orm";

import { retrieveSeveralCleanPosts } from "#server/utils/converters/interactions";
import { normalizeId } from "#server/utils/normalizers/ids";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);
	const postId = normalizeId(event.context.params?.id);

	const query = getQuery(event);

	const limit = Math.min(Number(query.limit) || 100, 100);
	const offset = Math.max(Number(query.offset) || 0, 0);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const [post] = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.limit(1);

	if (!post) {
		throw createError({
			statusCode: 404,
			statusMessage: "Post not found",
		});
	}

	const candidates = await db
		.select()
		.from(posts)
		.where(eq(posts.parentId, postId))
		// A stable order is required for offset pagination.
		.orderBy(asc(posts.createdAt))
		.limit(limit)
		.offset(offset);

	const _posts = await retrieveSeveralCleanPosts(event, identity, candidates);

	return {
		status: "ok",
		post: await retrieveCleanPost(event, identity, post),
		data: _posts,
		next: offset + limit,
		hasNext: candidates.length === limit,
	};
});
