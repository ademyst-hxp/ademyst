import { useDb } from "~~/server/db";
import { profileReports } from "~~/server/db/schema/reports";
import { and, eq } from "drizzle-orm";

import { retrieveSeveralCleanProfileReports } from "~~/server/utils/converters/reports";
import { REPORT_STATUSES, queryEnum } from "~~/server/utils/helpers/filters";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";

import { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	// Filter (optional): ?status=pending|reviewed|rejected
	const status = queryEnum(event, "status", REPORT_STATUSES);

	const profileId = normalizeId(event.context.params?.id);

	if (!profileId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid profile id",
		});
	}

	const dbReports = await db
		.select()
		.from(profileReports)
		.where(
			and(
				eq(profileReports.reportedProfileId, profileId),
				status ? eq(profileReports.status, status) : undefined,
			),
		);

	const reports = await retrieveSeveralCleanProfileReports(
		event,
		identity,
		dbReports,
	);

	return {
		status: "ok",
		reports,
	};
});
