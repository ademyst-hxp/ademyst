import { eq } from "drizzle-orm/sql/expressions/conditions";
import { desc } from "drizzle-orm/sql/expressions/select";

import { useDb } from "#server/db";
import { posts } from "#server/db/schema/interactions";
import { follows } from "#server/db/schema/relations";

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
		.from(follows)
		.where(eq(follows.followerId, identity.profileId))
		.innerJoin(posts, eq(follows.followingId, posts.profileId))
		.orderBy(desc(posts.createdAt))
		.limit(limit)
		.offset(offset);

	const resolvedPosts = await retrieveSeveralCleanPosts(
		event,
		identity,
		rawPosts.map((row) => row.posts),
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
