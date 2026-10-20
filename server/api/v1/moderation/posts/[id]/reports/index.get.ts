import { useDb } from "~~/server/db";
import { postReports } from "~~/server/db/schema/reports";
import { and, eq } from "drizzle-orm";

import { REPORT_STATUSES, queryEnum } from "~~/server/utils/helpers/filters";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";

import { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	// Filter (optional): ?status=pending|reviewed|rejected
	const status = queryEnum(event, "status", REPORT_STATUSES);

	const postId = normalizeId(event.context.params?.id);

	if (!postId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const dbReports = await db
		.select()
		.from(postReports)
		.where(
			and(
				eq(postReports.reportedPostId, postId),
				status ? eq(postReports.status, status) : undefined,
			),
		);

	const reports = await retrieveSeveralCleanPostReports(
		event,
		identity,
		dbReports,
	);

	return {
		status: "ok",
		reports,
	};
});
