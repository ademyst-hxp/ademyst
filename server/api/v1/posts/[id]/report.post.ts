import { createError, readBody } from "h3";

import { useDb } from "#server/db";
import { post_reports } from "#server/db/schema/reports";

import { normalizeId } from "#server/utils/normalizers/ids";
import {
	normalizeOptionalText,
	normalizeRequiredText,
} from "#server/utils/normalizers/posts";
import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const body = await readBody(event);
	const reason = normalizeRequiredText(body?.reason);
	const details = normalizeOptionalText(body?.details);

	if (!reason) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid report payload",
		});
	}

	await db.insert(post_reports).values({
		reporterId: identity.profileId,
		reportedPostId: postId,
		reason,
		details,
	});

	return { status: "ok" };
});
