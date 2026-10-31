import { useDb } from "~~/server/db";
import {
	postReports,
	profileReports,
	whisperReports,
} from "~~/server/db/schema/reports";
import { count, eq } from "drizzle-orm";

import { REPORT_STATUSES, queryEnum } from "~~/server/utils/helpers/filters";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	await requireAuth(event, { min_level: 7 });

	// Filters (all optional): ?status=pending|reviewed|rejected
	const status = queryEnum(event, "status", REPORT_STATUSES);

	const [postsRows, profilesRows, whispersRows] = await Promise.all([
		db
			.select({ value: count() })
			.from(postReports)
			.where(status ? eq(postReports.status, status) : undefined),
		db
			.select({ value: count() })
			.from(profileReports)
			.where(status ? eq(profileReports.status, status) : undefined),
		db
			.select({ value: count() })
			.from(whisperReports)
			.where(status ? eq(whisperReports.status, status) : undefined),
	]);

	const posts = postsRows[0]?.value ?? 0;
	const profiles = profilesRows[0]?.value ?? 0;
	const whispers = whispersRows[0]?.value ?? 0;

	return {
		status: "ok" as const,
		count: {
			total: posts + profiles + whispers,
			posts,
			profiles,
			whispers,
		},
	};
});
