import { useDb } from "~~/server/db";
import { whisperReports } from "~~/server/db/schema/reports";
import { desc, eq } from "drizzle-orm";

import {
	REPORT_STATUSES,
	queryEnum,
	queryPagination,
} from "~~/server/utils/helpers/filters";
import { retrieveSeveralCleanWhisperReports } from "~~/server/utils/converters/reports";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 7 });

	// Filters (all optional): ?status=pending|reviewed|rejected
	const { limit, offset } = queryPagination(event);
	const status = queryEnum(event, "status", REPORT_STATUSES);

	const _whisper_reports = await db
		.select()
		.from(whisperReports)
		.where(status ? eq(whisperReports.status, status) : undefined)
		.orderBy(desc(whisperReports.createdAt))
		.limit(limit)
		.offset(offset);

	return {
		status: "ok",
		reports: await retrieveSeveralCleanWhisperReports(
			event,
			identity,
			_whisper_reports,
		),
		next: offset + limit,
		hasNext: _whisper_reports.length === limit,
	};
});
