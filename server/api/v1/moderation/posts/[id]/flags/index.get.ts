import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { posts, postsFlags } from "~~/server/db/schema/interactions";
import type { PostFlag } from "~~/shared/models/interactions";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, {
		min_level: 6,
	});

	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const [post] = await db.select().from(posts).where(eq(posts.id, postId));

	if (!post) {
		throw createError({
			statusCode: 404,
			statusMessage: "Post not found",
		});
	}

	const rawFlags = await db
		.select()
		.from(postsFlags)
		.where(eq(postsFlags.postId, postId));

	const resolvedFlags: PostFlag[] = rawFlags.map((flag) =>
		convertPostFlag(flag),
	);

	return {
		status: "ok",
		flags: resolvedFlags,
		post: await retrieveCleanPost(event, identity, post),
	};
});
