import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";
import { profileReports } from "#server/db/schema/reports";
import { profiles } from "#server/db/schema/profiles";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeOptionalText, normalizeRequiredText } from "~~/server/utils/normalizers/interactions";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const name = normalizeId(event.context.params?.name);

	if (!name) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid profile name",
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

	const [existingProfile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.name, name))
		.limit(1);

	if (!existingProfile) {
		throw createError({
			statusCode: 404,
			statusMessage: "Profile not found",
		});
	}

	const [existingReport] = await db
		.select()
		.from(profileReports)
		.where(
			and(
				eq(profileReports.reporterId, identity.accountId),
				eq(profileReports.reportedProfileId, existingProfile.id),
				eq(profileReports.status, "pending"),
			)
		)
		.limit(1);

	if (existingReport) {
		throw createError({
			statusCode: 400,
			statusMessage: "You have already reported this profile",
		});
	}

	await db.insert(profileReports).values({
		reporterId: identity.profileId,
		reportedProfileId: existingProfile.id,
		reason,
		details,
	});

	return { status: "ok" };
});
