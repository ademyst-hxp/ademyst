import type { H3Event } from "h3";

import { createDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { posts } from "~~/server/db/schema/interactions";

import { retrieveCleanPost } from "#server/utils/converters/interactions";

import { normalizeId } from "#server/utils/normalizers/ids";

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
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
	} finally {
		await client.end();
	}
});
