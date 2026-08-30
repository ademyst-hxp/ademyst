import type { H3Event } from "h3";

import { createDb } from "~~/server/db";
import { eq, and } from "drizzle-orm";

import { sanctions } from "~~/server/db/schema/sanctions";
import {
	profileReports,
	postReports,
	whisperReports,
} from "~~/server/db/schema/reports";

import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";
import { profiles } from "~~/server/db/schema/profiles";
import { alerts } from "~~/server/db/schema/inbox";

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const id = event.context.params?.id;
		const sanctionId = event.context.params?.sanction;
		const normalizedId = normalizeId(id);
		const normalizedSanctionId = normalizeId(sanctionId);

		if (!normalizedId) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing user id",
			});
		}

		if (!normalizedSanctionId) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing sanction id",
			});
		}

		const identity = await requireAuth(event, {
			min_level: 8,
		});

		const { reason, details, expires_at, report_type, report_id } =
			(await readBody(event)) as {
				reason?: string;
				details?: string;
				expires_at?: string;
				report_type?: "profile" | "post" | "whisper";
				report_id?: string;
			};

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

		const [existing] = await db
			.select()
			.from(sanctions)
			.where(
				and(
					eq(sanctions.id, normalizedSanctionId),
					eq(sanctions.accountId, target.accountId),
				),
			)
			.limit(1);

		if (!existing) {
			throw createError({
				statusCode: 404,
				statusMessage: "Sanction not found",
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

		const [newSanction] = await db
			.update(sanctions)
			.set({
				reason: reason ?? existing.reason,
				details: details ?? existing.details,
				expiresAt: expires_at
					? new Date(expires_at)
					: existing.expiresAt,
				profileReportId:
					report_type === "profile"
						? report_id
						: existing.profileReportId,
				postReportId:
					report_type === "post" ? report_id : existing.postReportId,
				whisperReportId:
					report_type === "whisper"
						? report_id
						: existing.whisperReportId,
			})
			.where(
				and(
					eq(sanctions.id, normalizedSanctionId),
					eq(sanctions.accountId, target.accountId),
				),
			)
			.returning();

		if (!newSanction) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to update sanction",
			});
		}

		switch (newSanction.type) {
			case "ban":
				await db
					.update(profiles)
					.set({ level: 0 })
					.where(eq(profiles.id, normalizedId));

				await db.insert(alerts).values({
					profileId: normalizedId,
					type: "account_suspension",
					reason: "[UPDATED] " + newSanction.reason,
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
					reason: "[UPDATED] " + newSanction.reason,
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
					reason: "[UPDATED] " + newSanction.reason,
					details: details ?? "",
				});

				break;
			case "warning":
				await db.insert(alerts).values({
					profileId: normalizedId,
					type: "other",
					reason: "[UPDATED] " + newSanction.reason,
					details: details ?? "",
				});
				break;
		}

		return {
			status: "ok",
			data: await retrieveCleanSanction(event, identity, newSanction),
		};
	} finally {
		await client.end();
	}
});
