import { H3Event } from "h3";

import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";
import { status_reports } from "~~/server/db/schema/reports";

import { normalizeId } from "~~/server/utils/normalizers/ids";

import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const statusId = normalizeId(event.context.params?.id);

	if (!statusId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid status id",
		});
	}

	const dbReports = await db
		.select()
		.from(status_reports)
		.where(eq(status_reports.reportedStatusId, statusId))

	const reports = await retrieveSeveralCleanStatusReports(event, identity, dbReports);

	return {
		status: "ok",
		reports,
	};
});
