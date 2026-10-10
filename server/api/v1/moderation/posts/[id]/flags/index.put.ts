import { useDb } from "~~/server/db";
import { eq, and } from "drizzle-orm";

import { posts, postsFlags } from "~~/server/db/schema/interactions";
import type { PostFlag } from "~~/shared/models/interactions";

type PostFlagType = Exclude<PostFlag["type"], "reported">;
type Payload = Record<PostFlagType, boolean>;

const validTypes: PostFlagType[] = [
	"spam",
	"NFE",
	"AI",
	"joke",
	"misinformation",
	"suspicious",
];

function validatePayload(payload: any): Payload {
	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing payload",
		});
	}

	const flags: Payload = validTypes.reduce((acc, type) => {
		if (typeof payload?.[type] !== "boolean") {
			throw createError({
				statusCode: 400,
				statusMessage: `Invalid value for flag type "${type}"`,
			});
		}

		acc[type] = Boolean(payload?.[type]);
		return acc;
	}, {} as Payload);

	return flags;
}

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

	const entries = await readBody(event);
	const body = validatePayload(entries);

	const [post] = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId));

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

	const flagsToUpdate: Record<
		PostFlagType,
		"add" | "remove" | "nothing"
	> = {
		...validTypes.reduce(
			(acc, type) => {
				if (
					body[type] &&
					!rawFlags.some((flag) => flag.type === type)
				) {
					acc[type] = "add";
				} else if (
					!body[type] &&
					rawFlags.some((flag) => flag.type === type)
				) {
					acc[type] = "remove";
				} else {
					acc[type] = "nothing";
				}

				return acc;
			},
			{} as Record<PostFlagType, "add" | "remove" | "nothing">,
		),
	};

	for (const type of validTypes) {
		if (flagsToUpdate[type] === "add") {
			await db.insert(postsFlags).values({
				postId: postId,
				type: type,
			});
		} else if (flagsToUpdate[type] === "remove") {
			await db
				.delete(postsFlags)
				.where(
					and(
						eq(postsFlags.postId, postId),
						eq(postsFlags.type, type),
					),
				);
		}
	}

	const updatedRawFlags = await db
		.select()
		.from(postsFlags)
		.where(eq(postsFlags.postId, postId));

	const resolvedFlags: PostFlag[] = updatedRawFlags.map((flag) =>
		convertPostFlag(flag),
	);

	return {
		status: "ok",
		flags: resolvedFlags,
		post: await retrieveCleanPost(event, identity, post),
	};
});
