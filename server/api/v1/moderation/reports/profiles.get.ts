import { createDb } from "~~/server/db";

import { profileReports } from "~~/server/db/schema/reports";

import { retrieveSeveralCleanProfileReports } from "~~/server/utils/converters/reports";

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const identity = await requireAuth(event, { min_level: 7 });

		const limit = Number(event.context.query?.limit) || 100;
		const offset = Number(event.context.query?.offset) || 0;

		const _profile_reports = await db
			.select()
			.from(profileReports)
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
	} finally {
		await client.end();
	}
});
