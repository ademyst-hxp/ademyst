import { createError, readBody } from "h3";

import { useDb } from "#server/db";
import { posts } from "#server/db/schema/interactions";
import { generateHexId } from "#server/utils/ids";

import { normalizeId } from "#server/utils/normalizers/ids";
import {
	normalizeOptionalText,
	normalizeVisibility,
} from "#server/utils/normalizers/posts";

import { retrieveCleanPost } from "~~/server/utils/converters/interactions";
import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const quotedPostId = normalizeId(event.context.params?.id);

	if (event.context.params?.id && !quotedPostId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid quoted post id",
		});
	}

	const body = await readBody(event);
	const content = normalizeOptionalText(body?.content) ?? "";
	const visibility = normalizeVisibility(body?.visibility) ?? "everyone";
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

	const post = await retrieveCleanPost(identity, createdPost);

	return {
		status: "ok",
		post,
	};
});
