import { useDb } from "~~/server/db";
import { posts } from "~~/server/db/schema/interactions";
import { eq } from "drizzle-orm";

import { retrieveCleanPost } from "#server/utils/converters/interactions";
import { normalizeId } from "#server/utils/normalizers/ids";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);
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

	const post = await retrieveCleanPost(event, identity, candidate);

	return {
		status: "ok",
		data: post,
	};
});
