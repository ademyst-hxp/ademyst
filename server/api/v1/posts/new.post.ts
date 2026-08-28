import { createError, readBody } from "h3";

import { useDb } from "#server/db";
import { posts } from "#server/db/schema/interactions";
import { generateHexId } from "#server/utils/ids";

import { normalizeId } from "#server/utils/normalizers/ids";
import {
	normalizeOptionalText,
	normalizeVisibility,
} from "~~/server/utils/normalizers/interactions";

import { retrieveCleanPost } from "~~/server/utils/converters/interactions";
import { requireAuth } from "~~/server/utils/middleware/auth";

const validatePayload = (
	payload: any,
	specs: {
		max_length: number;
	},
): { content: string; visibility: PostVisibility } => {
	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing payload",
		});
	}

	const content = normalizeOptionalText(payload?.content);
	const visibility = normalizeVisibility(payload?.visibility) || "everyone";

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

	return { content, visibility };
};

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });
	const user = await getUser(event, identity);

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const quotedPostId = normalizeId(event.context.params?.id);

	if (event.context.params?.id && !quotedPostId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid quoted post id",
		});
	}

	const body = await readBody(event);
	const specs = {
		max_length:
			user.profile.level >= 5
				? 5000
				: user.profile.level >= 4
					? 2000
					: 1000,
	};

	const { content, visibility } = validatePayload(body, specs);

	const id = generateHexId();

	const [createdPost] = await db
		.insert(posts)
		.values({
			id,
			profileId: identity.profileId,
			parentId: quotedPostId,
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

	const post = await retrieveCleanPost(event, identity, createdPost);

	return {
		status: "ok",
		data: post,
	};
});
