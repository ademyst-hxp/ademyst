import { createError, readBody } from "h3";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm";

import { posts } from "#server/db/schema/interactions";
import { normalizeId } from "#server/utils/normalizers/ids";
import {
	normalizeOptionalText,
	normalizeVisibility,
} from "~~/server/utils/normalizers/interactions";

import { retrieveCleanPost } from "~~/server/utils/converters/interactions";
import { requireAuth } from "~~/server/utils/middleware/auth";

import { PostVisibility } from "~~/shared/models/interactions";

const validatePayload = (
	payload: any,
): { content: string | undefined; visibility: PostVisibility | undefined } => {
	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing payload",
		});
	}

	const content = normalizeOptionalText(payload?.content) || undefined;
	const visibility = normalizeVisibility(payload?.visibility) || undefined;

	return { content, visibility };
};

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const body = await readBody(event);
	const id = normalizeId(event.context.params?.id);

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const { content, visibility } = validatePayload(body);
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
