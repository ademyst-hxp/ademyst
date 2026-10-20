import { useDb } from "~~/server/db";
import { profileReports } from "~~/server/db/schema/reports";
import { desc, eq } from "drizzle-orm";

import {
	REPORT_STATUSES,
	queryEnum,
	queryPagination,
} from "~~/server/utils/helpers/filters";
import { retrieveSeveralCleanProfileReports } from "~~/server/utils/converters/reports";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 7 });

	// Filters (all optional): ?status=pending|reviewed|rejected
	const { limit, offset } = queryPagination(event);
	const status = queryEnum(event, "status", REPORT_STATUSES);

	const _profile_reports = await db
		.select()
		.from(profileReports)
		.where(status ? eq(profileReports.status, status) : undefined)
		.orderBy(desc(profileReports.createdAt))
		.limit(limit)
		.offset(offset);

	return {
		status: "ok",
		reports: await retrieveSeveralCleanProfileReports(
			event,
			identity,
			_profile_reports,
		),
		next: offset + limit,
		hasNext: _profile_reports.length === limit,
	};
});
