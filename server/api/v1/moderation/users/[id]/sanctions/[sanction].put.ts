import type { H3Event } from "h3";

import { useDb } from "~~/server/db";
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
import { accountSanctionNotifications } from "~~/server/db/schema/inbox";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

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

	const result = await db.transaction(async (tx) => {
		const [target] = await tx
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

		const [existing] = await tx
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

		// Validate the report if one is provided.
		switch (report_type) {
			case "profile": {
				if (!report_id) {
					throw createError({
						statusCode: 400,
						statusMessage:
							"Missing report id for profile report",
					});
				}

				const [profileReport] = await tx
					.select()
					.from(profileReports)
					.where(
						and(
							eq(profileReports.id, report_id),
							eq(
								profileReports.reportedProfileId,
								normalizedId,
							),
						),
					)
					.limit(1);

				if (!profileReport) {
					throw createError({
						statusCode: 404,
						statusMessage: "Profile report not found",
					});
				}

				break;
			}

			case "post": {
				if (!report_id) {
					throw createError({
						statusCode: 400,
						statusMessage: "Missing report id for post report",
					});
				}

				const [postReport] = await tx
					.select()
					.from(postReports)
					.where(eq(postReports.id, report_id))
					.limit(1);

				if (!postReport) {
					throw createError({
						statusCode: 404,
						statusMessage: "Post report not found",
					});
				}

				/*
				 * Add the equivalent target-profile/account check here
				 * if postReports exposes the reported post/profile/account.
				 */

				break;
			}

			case "whisper": {
				if (!report_id) {
					throw createError({
						statusCode: 400,
						statusMessage:
							"Missing report id for whisper report",
					});
				}

				const [whisperReport] = await tx
					.select()
					.from(whisperReports)
					.where(eq(whisperReports.id, report_id))
					.limit(1);

				if (!whisperReport) {
					throw createError({
						statusCode: 404,
						statusMessage: "Whisper report not found",
					});
				}

				/*
				 * Add the equivalent target-profile/account check here
				 * if whisperReports exposes the reported profile/account.
				 */

				break;
			}

			case undefined:
				break;

			default:
				throw createError({
					statusCode: 400,
					statusMessage: "Invalid report type",
				});
		}

		// Keep the existing expiration when expires_at isn't provided.
		let expiresAt = existing.expiresAt;

		if (expires_at !== undefined) {
			const parsedExpiresAt = new Date(expires_at);

			if (Number.isNaN(parsedExpiresAt.getTime())) {
				throw createError({
					statusCode: 400,
					statusMessage: "Invalid expiration date",
				});
			}

			expiresAt = parsedExpiresAt;
		}

		const [newSanction] = await tx
			.update(sanctions)
			.set({
				reason: reason ?? existing.reason,
				details: details ?? existing.details,
				expiresAt,
				profileReportId:
					report_type === "profile"
						? report_id
						: existing.profileReportId,
				postReportId:
					report_type === "post"
						? report_id
						: existing.postReportId,
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

		/*
		 * Warnings do not modify the account level.
		 * Only sanctions that affect the account state do.
		 */
		if (newSanction.type !== "warning") {
			const newLevel = (() => {
				switch (newSanction.type) {
					case "ban":
						return 0;
					case "mute":
						return 1;
					case "shadow_ban":
						return 2;
				}
			})();

			await tx
				.update(profiles)
				.set({
					level: newLevel,
				})
				.where(eq(profiles.id, normalizedId));
		}

		await tx
			.update(accountSanctionNotifications)
			.set({
				read: false,
				updatedAt: new Date(),
			})
			.where(
				eq(
					accountSanctionNotifications.sanctionId,
					normalizedSanctionId,
				),
			);

		return newSanction;
	});

	return {
		status: "ok",
		data: await retrieveCleanSanction(event, identity, result),
	};
});
