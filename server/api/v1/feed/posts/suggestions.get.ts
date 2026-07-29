import { desc } from "drizzle-orm/sql/expressions/select";

import { useDb } from "#server/db";
import { posts } from "#server/db/schema/interactions";

import { requireAuth } from "#server/utils/middleware/auth";
import { retrieveSeveralCleanPosts } from "#server/utils/converters/interactions";

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
	);

	const filteredPosts = resolvedPosts
		.filter((post): post is NonNullable<typeof post> => post !== null)
		.sort((a, b) => {
			let score = 0;
			score += b.createdAt.getTime() - a.createdAt.getTime() > 0 ? 1 : -1;
			score +=
				b.stats.reactions.like - a.stats.reactions.like > 0 ? 6 : -6;
			score +=
				(b.profile.level ?? 0) - (a.profile.level ?? 0) > 0 ? 3 : -3;

			return score;
		});

	return {
		status: "ok",
		posts: filteredPosts,
		next: offset + limit,
		hasNext: rawPosts.length === limit,
	};
});
