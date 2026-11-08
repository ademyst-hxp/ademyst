import { useDb } from "#server/db";
import { attachments } from "~~/server/db/schema/drive";
import { posts } from "~~/server/db/schema/interactions";
import { and, eq, inArray, isNull } from "drizzle-orm";

import { convertSeveralAttachments } from "~~/server/utils/converters/drive";
import { assertAttachmentSlots } from "~~/server/utils/helpers/attachments";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId, normalizeUUID } from "~~/server/utils/normalizers/ids";
import { ATTACHMENT_RULES } from "~~/shared/consts/specs";
import { getPostSpecs } from "~~/shared/utils/interactions";

import type { AttachmentType } from "~~/shared/models/drive";

import { createError, readBody } from "h3";
import type { H3Event } from "h3";

const validatePayload = (payload: any): string[] => {
	if (!payload || !Array.isArray(payload.attachments)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing attachments field",
		});
	}

	const ids = payload.attachments.map((id: unknown) => normalizeUUID(id));

	if (ids.length === 0 || ids.some((id: string | null) => !id)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid attachment ids",
		});
	}

	return [...new Set(ids as string[])];
};

// Rattache des Attachments orphelins (créés via POST /attachments/new)
// à une publication de l'utilisateur. Ils héritent de sa visibilité.
export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const ids = validatePayload(await readBody(event));
	const specs = getPostSpecs(identity.profile.level);

	const [post] = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.limit(1);

	if (!post) {
		throw createError({
			statusCode: 404,
			statusMessage: "Post not found",
		});
	}

	if (post.profileId !== identity.profileId) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are not allowed to edit this post",
		});
	}

	const [pending, current] = await Promise.all([
		db
			.select()
			.from(attachments)
			.where(
				and(
					inArray(attachments.id, ids),
					eq(attachments.authorId, identity.profileId),
					isNull(attachments.postId),
				),
			),
		db.select().from(attachments).where(eq(attachments.postId, post.id)),
	]);

	if (pending.length !== ids.length) {
		throw createError({
			statusCode: 404,
			statusMessage: "Some attachments are missing or already attached",
		});
	}

	// Limites par type : existants + entrants.
	for (const type of Object.keys(ATTACHMENT_RULES) as AttachmentType[]) {
		const incoming = pending.filter((a) => a.type === type).length;

		if (incoming > 0) {
			assertAttachmentSlots(
				type,
				current.filter((a) => a.type === type).length,
				specs,
				incoming,
			);
		}
	}

	await db
		.update(attachments)
		.set({ postId: post.id, visibility: post.visibility })
		.where(inArray(attachments.id, ids));

	const result = await db
		.select()
		.from(attachments)
		.where(eq(attachments.postId, post.id))
		.orderBy(attachments.createdAt);

	return {
		status: "ok",
		data: convertSeveralAttachments(result),
	};
});
