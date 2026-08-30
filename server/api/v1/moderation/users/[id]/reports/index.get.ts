import { H3Event } from "h3";

import { createDb } from "~~/server/db";
import { eq } from "drizzle-orm";
import { profileReports } from "~~/server/db/schema/reports";

import { normalizeId } from "~~/server/utils/normalizers/ids";

import { requireAuth } from "~~/server/utils/middleware/auth";
import { retrieveSeveralCleanProfileReports } from "~~/server/utils/converters/reports";

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
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
	} finally {
		await client.end();
	}
});
