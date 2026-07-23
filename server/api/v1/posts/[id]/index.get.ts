import { db } from "~~/server/db";
import { eq } from "drizzle-orm";

import { posts } from "~~/server/db/schema/interactions";

import { retrieveCleanPost } from "#server/utils/converters/interactions";

import { normalizeId } from "#server/utils/normalizers/ids";

export default defineEventHandler(async (event) => {
	const identity = await getIdentity(event);
	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const post = (await db.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.limit(1))[0];

	if (!post) {
		throw createError({
			statusCode: 404,
			statusMessage: "Post not found",
		});
	}

	return retrieveCleanPost(
		identity,
		post,
	);
});
