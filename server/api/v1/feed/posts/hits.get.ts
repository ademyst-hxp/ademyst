import { eq, and, lt } from "drizzle-orm/sql/expressions/conditions";
import { desc } from "drizzle-orm/sql/expressions/select";

import { db } from "#server/db";
import { posts } from "#server/db/schema/interactions";
import { follows } from "#server/db/schema/relations";

import { requireAuth } from "#server/utils/middleware/auth";
import { retrieveSeveralCleanPosts } from "#server/utils/converters/interactions";

export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event);

	const query = getQuery(event);

	const limit = Math.min(Number(query.limit) || 100, 100);
	const offset = Math.max(Number(query.offset) || 0, 0);

	const rawPosts = await db
		.select()
		.from(follows)
		.where(eq(follows.followerId, identity.profileId))
		.innerJoin(
			posts,
			and(
				eq(follows.followingId, posts.profileId),
				lt(
					posts.createdAt,
					new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
				),
			),
		)
		.orderBy(desc(posts.createdAt))
		.limit(limit)
		.offset(offset);

	console.log(rawPosts.map((row) => row.posts.createdAt), new Date(Date.now() - 1000 * 60 * 60 * 24 * 7));

	const resolvedPosts = await retrieveSeveralCleanPosts(
		identity,
		rawPosts.map((row) => row.posts),
	);

	const filteredPosts = resolvedPosts
		.filter((post): post is NonNullable<typeof post> => post !== null)
		.sort((a, b) => {
			let score = 0;

			score += 1 * (b.stats.reactions.like - a.stats.reactions.like);
			score += 1.5 * (b.stats.answers - a.stats.answers);

			return score;
		});

	return {
		status: "ok",
		posts: filteredPosts,
		next: offset + limit,
		hasNext: rawPosts.length === limit,
	};
});
