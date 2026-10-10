import type { H3Event } from "h3";

import { useDb } from "~~/server/db";
import { and, eq, lt } from "drizzle-orm";

import { sanctions, SanctionType } from "~~/server/db/schema/sanctions";
import {
	profileReports,
	postReports,
	whisperReports,
} from "~~/server/db/schema/reports";

import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";
import { profiles } from "~~/server/db/schema/profiles";
import { accountSanctionNotifications } from "~~/server/db/schema/inbox";
import { levelsEntitlements } from "~~/server/db/schema/entitlements";

export default defineEventHandler(async (event: H3Event) => {
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

	const validTypes: SanctionType[] = [
		"ban",
		"mute",
		"shadow_ban",
		"warning",
	];

	if (!type || !validTypes.includes(type)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid sanction type",
		});
	}

	if (!reason?.trim()) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing reason",
		});
	}

	// Validate expiration date before doing any database mutation.
	let expiresAt: Date | null = null;

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

	/*
	 * A moderator must have a level strictly higher than the target.
	 *
	 * mute / warning require at least level 6.
	 * ban / shadow_ban require at least level 7.
	 */
	const requiredLevel = Math.max(
		["mute", "warning"].includes(type) ? 6 : 7,
		(target.level ?? 0) + 1,
	);

	const identity = await requireAuth(event, {
		min_level: requiredLevel,
	});

	/*
	 * Validate the report before creating the sanction.
	 *
	 * Profile reports are explicitly checked against the target profile.
	 * Post/whisper reports should receive the equivalent target check
	 * if their schemas expose the reported profile/account.
	 */
	switch (report_type) {
		case "profile": {
			if (!report_id) {
				throw createError({
					statusCode: 400,
					statusMessage: "Missing report id for profile report",
				});
			}

			const [profileReport] = await db
				.select()
				.from(profileReports)
				.where(
					and(
						eq(profileReports.id, report_id),
						eq(profileReports.reportedProfileId, normalizedId),
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

			const [postReport] = await db
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
			 * TODO:
			 * Check that this report belongs to normalizedId
			 * using the actual postReports schema.
			 */

			break;
		}

		case "whisper": {
			if (!report_id) {
				throw createError({
					statusCode: 400,
					statusMessage: "Missing report id for whisper report",
				});
			}

			const [whisperReport] = await db
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
			 * TODO:
			 * Check that this report belongs to normalizedId
			 * using the actual whisperReports schema.
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

	const sanction = await db.transaction(async (tx) => {
		// Create the sanction log.
		const [createdSanction] = await tx
			.insert(sanctions)
			.values({
				accountId: target.accountId,
				issuerId: identity.accountId,
				type,
				reason: reason.trim(),
				details,
				expiresAt,
				profileReportId:
					report_type === "profile" ? report_id : null,
				postReportId: report_type === "post" ? report_id : null,
				whisperReportId:
					report_type === "whisper" ? report_id : null,
			})
			.returning();

		if (!createdSanction) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to create sanction",
			});
		}

		/*
		 * Only account-level sanctions affect the active level
		 * entitlement. Warnings are logged/notified but do not
		 * alter the account level.
		 */
		if (type !== "warning") {
			// Revoke existing level sanctions.
			await tx
				.update(levelsEntitlements)
				.set({
					enabled: false,
					revoked: true,
				})
				.where(
					and(
						eq(levelsEntitlements.profileId, normalizedId),
						lt(levelsEntitlements.levelId, 3),
					),
				);

			const levelId = type === "ban" ? 0 : type === "mute" ? 1 : 2;

			await tx.insert(levelsEntitlements).values({
				profileId: normalizedId,
				name: type,
				reason: createdSanction.reason,
				levelId,
				enabled: true,
				revoked: false,
				expiresAt: createdSanction.expiresAt ?? null,
			});

			await tx
				.update(profiles)
				.set({
					level: levelId,
				})
				.where(eq(profiles.id, normalizedId));
		}

		// Create the sanction notification.
		const sanctionTypes = {
			ban: "account_suspension",
			mute: "mute",
			shadow_ban: "shadow_ban",
			warning: "warn",
		} as const;

		await tx.insert(accountSanctionNotifications).values({
			profileId: normalizedId,
			issuerId: identity.profileId,
			sanctionId: createdSanction.id,
			type: sanctionTypes[createdSanction.type],
			reason: createdSanction.reason,
			details: createdSanction.details ?? "",
		});

		return createdSanction;
	});

	return {
		status: "ok",
		data: await retrieveCleanSanction(event, identity, sanction),
	};
});
