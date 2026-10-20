import { useDb } from "~~/server/db";
import { postReports } from "~~/server/db/schema/reports";
import { desc, eq } from "drizzle-orm";

import {
	REPORT_STATUSES,
	queryEnum,
	queryPagination,
} from "~~/server/utils/helpers/filters";
import { retrieveSeveralCleanPostReports } from "~~/server/utils/converters/reports";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 7 });

	// Filters (all optional): ?status=pending|reviewed|rejected
	const { limit, offset } = queryPagination(event);
	const status = queryEnum(event, "status", REPORT_STATUSES);

	const _post_reports = await db
		.select()
		.from(postReports)
		.where(status ? eq(postReports.status, status) : undefined)
		.orderBy(desc(postReports.createdAt))
		.limit(limit)
		.offset(offset);

	return {
		status: "ok",
		reports: await retrieveSeveralCleanPostReports(
			event,
			identity,
			_post_reports,
		),
		next: offset + limit,
		hasNext: _post_reports.length === limit,
	};
});
