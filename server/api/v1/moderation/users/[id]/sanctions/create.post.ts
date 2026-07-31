import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { sanctions, SanctionType } from "~~/server/db/schema/sanctions";
import {
	profileReports,
	postReports,
	whisperReports,
} from "~~/server/db/schema/reports";

import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";
import { profiles } from "~~/server/db/schema/profiles";
import { alerts } from "~~/server/db/schema/inbox";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const id = event.context.params?.id;
	const normalizedId = normalizeId(id);

	if (!normalizedId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing user id",
		});
	}

	const { type, reason, details, expires_at, report_type, report_id } =
		(await readBody(event)) as {
			reason: string;
			details?: string;
			type: SanctionType;
			expires_at?: string;
			report_type?: "profile" | "post" | "whisper";
			report_id?: string;
		};

	const identity = await requireAuth(event, {
		min_level: ["mute", "warning"].includes(type) ? 6 : 7,
	});

	const validTypes: SanctionType[] = ["ban", "mute", "shadow_ban", "warning"];

	if (!type || !validTypes.includes(type)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid sanction type",
		});
	}

	if (!reason) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing reason",
		});
	}

	switch (report_type) {
		case "profile":
			if (!report_id) {
				throw createError({
					statusCode: 400,
					statusMessage: "Missing report id for profile report",
				});
			}

			const [profileReport] = await db
				.select()
				.from(profileReports)
				.where(eq(profileReports.id, report_id));

			if (!profileReport) {
				throw createError({
					statusCode: 404,
					statusMessage: "Profile report not found",
				});
			}
			break;
		case "post":
			if (!report_id) {
				throw createError({
					statusCode: 400,
					statusMessage: "Missing report id for post report",
				});
			}

			const [postReport] = await db
				.select()
				.from(postReports)
				.where(eq(postReports.id, report_id));

			if (!postReport) {
				throw createError({
					statusCode: 404,
					statusMessage: "Post report not found",
				});
			}
			break;
		case "whisper":
			if (!report_id) {
				throw createError({
					statusCode: 400,
					statusMessage: "Missing report id for whisper report",
				});
			}

			const [whisperReport] = await db
				.select()
				.from(whisperReports)
				.where(eq(whisperReports.id, report_id));

			if (!whisperReport) {
				throw createError({
					statusCode: 404,
					statusMessage: "Whisper report not found",
				});
			}
			break;
		case undefined:
			break;
		default:
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid report type",
			});
	}

	const [target] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, normalizedId))
		.limit(1);

	if (!target) {
		throw createError({
			statusCode: 404,
			statusMessage: "User not found",
		});
	}

	const [sanction] = await db
		.insert(sanctions)
		.values({
			accountId: target.accountId,
			issuerId: identity.accountId,
			type,
			reason,
			details,
			expiresAt: expires_at ? new Date(expires_at) : null,
			profileReportId: report_type === "profile" ? report_id : null,
			postReportId: report_type === "post" ? report_id : null,
			whisperReportId: report_type === "whisper" ? report_id : null,
		})
		.returning();

	if (!sanction) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to create sanction",
		});
	}

	switch (type) {
		case "ban":
			await db
				.update(profiles)
				.set({ level: 0 })
				.where(eq(profiles.id, normalizedId));

			await db.insert(alerts).values({
				profileId: normalizedId,
				type: "account_suspension",
				reason,
				details: details ?? "",
			});
			break;
		case "mute":
			await db
				.update(profiles)
				.set({ level: 1 })
				.where(eq(profiles.id, normalizedId));

			await db.insert(alerts).values({
				profileId: normalizedId,
				type: "sanction",
				reason,
				details: details ?? "",
			});
			break;
		case "shadow_ban":
			await db
				.update(profiles)
				.set({ level: 2 })
				.where(eq(profiles.id, normalizedId));

			await db.insert(alerts).values({
				profileId: normalizedId,
				type: "sanction",
				reason,
				details: details ?? "",
			});

			break;
		case "warning":
			await db.insert(alerts).values({
				profileId: normalizedId,
				type: "other",
				reason,
				details: details ?? "",
			});
			break;
	}

	return {
		status: "ok",
		data: await retrieveCleanSanction(event, identity, sanction),
	};
});
