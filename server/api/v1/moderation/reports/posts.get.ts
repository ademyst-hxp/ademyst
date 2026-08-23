import { useDb } from "~~/server/db";

import { postReports } from "~~/server/db/schema/reports";

import { retrieveSeveralCleanPostReports } from "~~/server/utils/converters/reports";

export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event, { min_level: 7 });

	const db = useDb(event);

	const limit = Number(event.context.query?.limit) || 100;
	const offset = Number(event.context.query?.offset) || 0;

	const _post_reports = await db
		.select()
		.from(postReports)
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
