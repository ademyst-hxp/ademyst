import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { profiles } from "#server/db/schema/profiles";
import { posts, postsFlags } from "#server/db/schema/interactions";
import { follows } from "#server/db/schema/relations";
import { eq } from "drizzle-orm";

import { generateHexId } from "#server/utils/ids";
import { normalizeId } from "#server/utils/normalizers/ids";
import { retrieveCleanPost } from "~~/server/utils/converters/interactions";
import { requireAuth } from "~~/server/utils/middleware/auth";
import {
	normalizeOptionalText,
	normalizeVisibility,
} from "~~/server/utils/normalizers/interactions";
import { getPostSpecs, getHashtagsFromContent } from "~~/shared/utils/interactions";

import type { PostFlag } from "~~/shared/models/interactions";

import type { H3Event } from "h3";

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
): {
	parentId: string | null;
	content: string;
	visibility: PostVisibility;
	flag_entries: FlagsPayload;
} => {
	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing payload",
		});
	}

	const parentId = normalizeId(payload?.parentId) || null;
	const content = normalizeOptionalText(payload?.content);
	const visibility = normalizeVisibility(payload?.visibility) || "everyone";

	if (payload?.parentId && !parentId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid parent post id",
		});
	}

	if (!content) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing content field",
		});
	}

	if (content.length > specs.max_length) {
		throw createError({
			statusCode: 400,
			statusMessage: `Post content exceeds maximum length of ${specs.max_length} characters`,
		});
	}

	const flag_entries = validateFlagsPayload(payload?.flags);

	return { parentId, content, visibility, flag_entries };
};

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const body = await readBody(event);
	const specs = getPostSpecs(identity.profile.level);

	const { parentId, content, visibility, flag_entries } = validatePayload(
		body,
		specs,
	);

	const id = generateHexId();

	const [createdPost] = await db
		.insert(posts)
		.values({
			id,
			profileId: identity.profileId,
			parentId,
			content,
			visibility,
		})
		.returning();

	if (!createdPost) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to create post",
		});
	}

	// Handle hashtags
	const hashtagList = getHashtagsFromContent(createdPost.content);

	if (hashtagList.length > 0) {
		await upsertTagsForPost(event, createdPost, {
			NFE: flag_entries.NFE,
			irrelevant: false,
			suicide: flag_entries.suicide,
		}, hashtagList);
	}

	// Handle flags
	const rawFlags = await db
		.select()
		.from(postsFlags)
		.where(eq(postsFlags.postId, createdPost.id));

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
				postId: createdPost.id,
				type: type,
			});
		} // cannot remove
	}

	// Notify parent post author if the new post is a reply and the author is not the same as the replier
	if (parentId && createdPost.profileId !== identity.profileId) {
		const [parentPost] = await db
			.select({ profileId: posts.profileId, accountId: profiles.accountId })
			.from(posts)
			.innerJoin(profiles, eq(profiles.id, posts.profileId))
			.where(eq(posts.id, parentId))
			.limit(1);

		if (parentPost && parentPost.profileId !== identity.profileId) {
			await db.insert(notifications).values({
				accountId: parentPost.accountId,
				profileId: parentPost.profileId,
				actorId: identity.profileId,
				postId: createdPost.id,
				type: "interaction.reply",
				data: {},
			});
		}
	}

	// Notify followers of the author if the post is public (not "me" or "friends")
	if (visibility !== "me" && visibility !== "friends") {
		const followers = await db
			.select({ profileId: follows.followerId, accountId: profiles.accountId })
			.from(follows)
			.innerJoin(profiles, eq(profiles.id, follows.followerId))
			.where(eq(follows.followingId, identity.profileId));

		if (followers.length > 0) {
			await db.insert(notifications).values(
				followers.map(({ profileId, accountId }) => ({
					accountId,
					profileId,
					actorId: identity.profileId,
					postId: createdPost.id,
					type: "content.post" as const,
					data: {},
				})),
			);
		}
	}

	const post = await retrieveCleanPost(event, identity, createdPost);

	return {
		status: "ok",
		data: post,
	};
});
