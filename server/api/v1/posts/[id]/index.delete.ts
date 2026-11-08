import { useDb } from "~~/server/db";
import { attachments } from "~~/server/db/schema/drive";
import { posts } from "~~/server/db/schema/interactions";
import { eq } from "drizzle-orm";

import { deleteAttachmentFiles } from "#server/utils/helpers/attachments";
import { normalizeId } from "#server/utils/normalizers/ids";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const [candidate] = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.limit(1);

	if (!candidate) {
		throw createError({
			statusCode: 404,
			statusMessage: "Post not found",
		});
	}

	if (!(
		candidate.profileId === identity.profileId || identity.profile.level >= 7
	)) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are not authorized to delete this post",
		});
	}

	// Les lignes partent en cascade, pas les fichiers du bucket
	const files = await db
		.select()
		.from(attachments)
		.where(eq(attachments.postId, postId));

	await db.delete(posts).where(eq(posts.id, postId));
	await deleteAttachmentFiles(event, files);

	return {
		status: "ok",
	};
});
