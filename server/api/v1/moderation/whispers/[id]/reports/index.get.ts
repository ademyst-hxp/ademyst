import { useDb } from "~~/server/db";
import { whisperReports } from "~~/server/db/schema/reports";
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

	const whisperId = normalizeId(event.context.params?.id);

	if (!whisperId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid whisper id",
		});
	}

	const dbReports = await db
		.select()
		.from(whisperReports)
		.where(
			and(
				eq(whisperReports.reportedWhisperId, whisperId),
				status ? eq(whisperReports.status, status) : undefined,
			),
		);

	const reports = await retrieveSeveralCleanWhisperReports(
		event,
		identity,
		dbReports,
	);

	return {
		status: "ok",
		reports,
	};
});
