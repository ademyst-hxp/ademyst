import { useDb } from "#server/db";
import { posts } from "#server/db/schema/interactions";
import { desc } from "drizzle-orm/sql/expressions/select";

import { retrieveSeveralCleanPosts } from "#server/utils/converters/interactions";
import { requireAuth } from "#server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

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
		true,
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
		.filter((post) => post.profile.level >= 3)
		.sort((a, b) => {
			return b.stats.score - a.stats.score;
		});

	return {
		status: "ok",
		posts: filteredPosts,
		next: offset + limit,
		hasNext: rawPosts.length === limit,
	};
});
