import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { posts } from "~~/server/db/schema/interactions";

import { retrieveSeveralCleanPosts } from "#server/utils/converters/interactions";

import { normalizeId } from "#server/utils/normalizers/ids";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);
	const postId = normalizeId(event.context.params?.id);

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
		.where(eq(posts.parentId, postId));

	const _posts = await retrieveSeveralCleanPosts(event, identity, candidates);

	return {
		status: "ok",
		post: await retrieveCleanPost(event, identity, post),
		data: _posts,
	};
});
