import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";
import { whisperReports } from "#server/db/schema/reports";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeOptionalText, normalizeRequiredText } from "~~/server/utils/normalizers/interactions";

import type { H3Event } from "h3";

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

	const body = await readBody(event);
	const reason = normalizeRequiredText(body?.reason);
	const details = normalizeOptionalText(body?.details);

	if (!reason) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid report payload",
		});
	}

	const [existingReport] = await db
		.select()
		.from(whisperReports)
		.where(
			and(
				eq(whisperReports.reporterId, identity.accountId),
				eq(whisperReports.reportedWhisperId, whisperId),
				eq(whisperReports.status, "pending"),
			)
		)
		.limit(1);

	if (existingReport) {
		throw createError({
			statusCode: 400,
			statusMessage: "You have already reported this whisper",
		});
	}

	await db.insert(whisperReports).values({
		reporterId: identity.profileId,
		reportedWhisperId: whisperId,
		reason,
		details,
	});

	return { status: "ok" };
});
