import { desc } from "drizzle-orm/sql/expressions/select";

import { createDb } from "#server/db";
import { posts } from "#server/db/schema/interactions";

import { requireAuth } from "#server/utils/middleware/auth";
import { retrieveSeveralCleanPosts } from "#server/utils/converters/interactions";

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
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

		const resolvedPosts = await retrieveSeveralCleanPosts(
			event,
			identity,
			rawPosts,
		);

		const filteredPosts = resolvedPosts
			.filter((post): post is NonNullable<typeof post> => post !== null)
			.filter(
				(post) =>
					!(
						post.flags.spam ||
						post.flags.NFE ||
						post.flags.AI ||
						post.flags.misinformation ||
						post.flags.reported
					),
			)
			.sort((a, b) => {
				return b.stats.score - a.stats.score;
			});

		return {
			status: "ok",
			posts: filteredPosts,
			next: offset + limit,
			hasNext: rawPosts.length === limit,
		};
	} finally {
		await client.end();
	}
});
