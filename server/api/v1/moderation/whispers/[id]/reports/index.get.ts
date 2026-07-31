import { H3Event } from "h3";

import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";
import { whisperReports } from "~~/server/db/schema/reports";

import { normalizeId } from "~~/server/utils/normalizers/ids";

import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

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
		.where(eq(whisperReports.reportedWhisperId, whisperId))

	const reports = await retrieveSeveralCleanWhisperReports(event, identity, dbReports);

	return {
		status: "ok",
		reports,
	};
});
