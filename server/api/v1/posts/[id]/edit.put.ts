import { useDb } from "#server/db";
import { posts, postsFlags } from "#server/db/schema/interactions";
import { eq } from "drizzle-orm";

import { normalizeId } from "#server/utils/normalizers/ids";
import { retrieveCleanPost } from "~~/server/utils/converters/interactions";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeOptionalText, normalizeVisibility } from "~~/server/utils/normalizers/interactions";

import { PostVisibility, PostFlag } from "~~/shared/models/interactions";

import { createError, readBody } from "h3";
import { type H3Event } from "h3";


type PostFlagType = Exclude<
	PostFlag["type"],
	"reported" | "spam" | "misinformation" | "suspicious"
>;
type FlagsPayload = Record<PostFlagType, boolean>;

const validTypes: PostFlagType[] = ["NFE", "AI", "joke", "suicide"];

function validateFlagsPayload(payload: any): FlagsPayload {
	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing payload",
		});
	}

	const flags: FlagsPayload = validTypes.reduce((acc, type) => {
		if (typeof payload?.[type] !== "boolean") {
			throw createError({
				statusCode: 400,
				statusMessage: `Invalid value for flag type "${type}"`,
			});
		}

		acc[type] = Boolean(payload?.[type]);
		return acc;
	}, {} as FlagsPayload);

	return flags;
}

const validatePayload = (
	payload: any,
	specs: {
		max_length: number;
	},
): { content: string | undefined; visibility: PostVisibility | undefined; flag_entries: FlagsPayload } => {
	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing payload",
		});
	}

	const content = normalizeOptionalText(payload?.content) || undefined;
	const visibility = normalizeVisibility(payload?.visibility) || undefined;

	if (content && content.length > specs.max_length) {
		throw createError({
			statusCode: 400,
			statusMessage: `Post content exceeds maximum length of ${specs.max_length} characters`,
		});
	}

	const flag_entries = validateFlagsPayload(payload?.flags);

	return { content, visibility, flag_entries };
};

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });
	const user = await getUser(event, identity);

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const body = await readBody(event);
	const id = normalizeId(event.context.params?.id);

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const specs = {
		max_length:
			user.profile.level >= 5
				? 5000
				: user.profile.level >= 4
					? 2000
					: 1000,
	};

	let [candidate] = await db.select()
		.from(posts)
		.where(eq(posts.id, id));

	if (!candidate) {
		throw createError({
			statusCode: 404,
			statusMessage: "Post not found",
		});
	}

	if (candidate.profileId !== user.profileId) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are not allowed to edit this post",
		});
	}

	const { content, visibility, flag_entries } = validatePayload(body, specs);


	// Handle flags
	const rawFlags = await db
		.select()
		.from(postsFlags)
		.where(eq(postsFlags.postId, candidate.id));

	const flagsToUpdate: Record<PostFlagType, "add" | "remove" | "nothing"> = {
		...validTypes.reduce(
			(acc, type) => {
				if (
					flag_entries[type] &&
					!rawFlags.some((flag) => flag.type === type)
				) {
					acc[type] = "add";
				} else if (
					!flag_entries[type] &&
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
				postId: candidate.id,
				type: type,
			});
		} // cannot remove
	}

	// Update post content and visibility
	let updatedAt = undefined;
	if (content) updatedAt = new Date();

	const [editedPost] = await db
		.update(posts)
		.set({
			content,
			visibility,
			updatedAt,
		})
		.where(eq(posts.id, id))
		.returning();

	if (!editedPost) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to edit post",
		});
	}

	const post = await retrieveCleanPost(event, identity, editedPost);

	return {
		status: "ok",
		data: post,
	};
});
