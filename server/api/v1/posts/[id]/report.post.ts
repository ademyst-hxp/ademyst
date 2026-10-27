import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";
import { postReports } from "#server/db/schema/reports";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeOptionalText, normalizeRequiredText } from "~~/server/utils/normalizers/interactions";

import { createError, readBody } from "h3";
import { type H3Event } from "h3";

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

	const body = await readBody(event);
	const reason = normalizeRequiredText(body?.reason);
	const details = normalizeOptionalText(body?.details);

	if (!reason) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid report payload",
		});
	}

	const [existingReport] = await db
		.select()
		.from(postReports)
		.where(
			and(
				eq(postReports.reporterId, identity.accountId),
				eq(postReports.reportedPostId, postId),
				eq(postReports.status, "pending"),
			)
		)
		.limit(1);

	if (existingReport) {
		throw createError({
			statusCode: 400,
			statusMessage: "You have already reported this post",
		});
	}

	await db.insert(postReports).values({
		reporterId: identity.accountId,
		reportedPostId: postId,
		reason,
		details,
	});

	return { status: "ok" };
});
