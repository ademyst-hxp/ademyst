import { eq } from "drizzle-orm/sql/expressions/conditions";
import { desc } from "drizzle-orm/sql/expressions/select";

import { db } from "#server/db";
import { profiles } from "#server/db/schema/profiles";
import { posts } from "#server/db/schema/interactions";

import { requireAuth } from "#server/utils/middleware/auth";
import { retrieveCleanPost } from "#server/utils/converters/interactions";

export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event);

	const query = getQuery(event);

	const limit = Math.min(Number(query.limit) || 100, 100);
	const offset = Math.max(Number(query.offset) || 0, 0);

	const rawPosts = await db
		.select()
		.from(posts)
		.orderBy(desc(posts.createdAt))
		.limit(limit)
		.offset(offset);

	const resolvedPosts = await Promise.all(
		rawPosts.map(async (post) => {
			const authors = await db
				.select()
				.from(profiles)
				.where(eq(profiles.id, post.profileId));

			const author = authors[0];

			if (!author) {
				return null;
			}

			return await retrieveCleanPost(identity, post);
		}),
	);

	const filteredPosts = resolvedPosts.filter(
		(post): post is NonNullable<typeof post> => post !== null,
	);

	return {
		status: "ok",
		posts: filteredPosts,
		next: offset + limit,
		hasNext: rawPosts.length === limit,
	};
});
