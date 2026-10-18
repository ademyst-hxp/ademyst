import { useDb } from "~~/server/db";
import { profileReports } from "~~/server/db/schema/reports";
import { eq } from "drizzle-orm";

import { retrieveSeveralCleanProfileReports } from "~~/server/utils/converters/reports";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";

import { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

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
		.where(eq(profileReports.reportedProfileId, profileId));

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
