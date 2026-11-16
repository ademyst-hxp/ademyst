import { useDb } from "#server/db";
import { posts, postsHashtags, hashtags } from "#server/db/schema/interactions";
import { eq, count, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);

	const query = getQuery(event);

	const limit = Math.min(Number(query.limit) || 100, 100);
	const offset = Math.max(Number(query.offset) || 0, 0);
	let exclude_posts =
		(query.exclude_posts as string | undefined) === "true";

	const tag = event.context.params?.tag?.toLowerCase();

	if (!tag) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing tag",
		});
	}

	let [hashtag] = await db
		.select()
		.from(hashtags)
		.where(eq(hashtags.tag, tag))
		.limit(1);

	if (!hashtag) {
		// On ne crée pas de hashtag ici pour éviter le spam

		exclude_posts = true;

		hashtag = {
			tag,
			NFE: false,
			irrelevant: false,
			suicide: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}

	if (exclude_posts) {
		return {
			status: "ok",
			hashtag: retrieveCleanHashtag(event, identity, hashtag),
			total: 0,
			posts: [],
			next: offset + limit,
			hasNext: false,
		};
	}

	const candidates = await db
		.select()
		.from(postsHashtags)
		.where(eq(postsHashtags.hashtag, hashtag.tag))
		.innerJoin(posts, eq(postsHashtags.postId, posts.id))
		.orderBy(desc(posts.createdAt))
		.limit(limit)
		.offset(offset);

	const resolvedPosts = await retrieveSeveralCleanPosts(
		event,
		identity,
		candidates.map((row) => row.posts),
		true,
	);

	const filteredPosts = resolvedPosts.filter(
		(post): post is NonNullable<typeof post> => post !== null,
	);

	const [hashtagCount] = await db
		.select({ count: count() })
		.from(postsHashtags)
		.where(eq(postsHashtags.hashtag, hashtag.tag));

	return {
		status: "ok",
		hashtag: retrieveCleanHashtag(event, identity, hashtag),
		posts: filteredPosts,
		total: Number(hashtagCount?.count || 0),
		next: offset + limit,
		hasNext: filteredPosts.length === limit,
	};
});
