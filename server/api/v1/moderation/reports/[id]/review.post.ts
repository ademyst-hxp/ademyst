import { useDb } from "~~/server/db";
import { notifications } from "~~/server/db/schema/inbox";
import { profiles } from "~~/server/db/schema/profiles";
import { postReports, profileReports, whisperReports } from "~~/server/db/schema/reports";
import { eq } from "drizzle-orm";

import { retrieveCleanPostReport, retrieveCleanProfileReport, retrieveCleanWhisperReport } from "~~/server/utils/converters/reports";

import type { PostReport } from "~~/shared/models/reports";
import type { ProfileReport } from "~~/shared/models/reports";
import type { WhisperReport } from "~~/shared/models/reports";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const { id } = event.context.params as { id: string };
	const { status } = (await readBody(event)) as {
		status: "pending" | "reviewed" | "rejected";
	};

	if (!["pending", "reviewed", "rejected"].includes(status)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid status",
		});
	}

	const identity = await requireAuth(event, { min_level: 7 });

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	let _report: ProfileReport | PostReport | WhisperReport | null = null;
	let _type: "profile" | "post" | "whisper" | null = null;

	const [_profile_report] = await db
		.select()
		.from(profileReports)
		.where(eq(profileReports.id, id))
		.limit(1);

	const [_post_report] = await db
		.select()
		.from(postReports)
		.where(eq(postReports.id, id))
		.limit(1);

	const [_whisper_report] = await db
		.select()
		.from(whisperReports)
		.where(eq(whisperReports.id, id))
		.limit(1);

	if (_profile_report) {
		_type = "profile";
		_report = await retrieveCleanProfileReport(
			event,
			identity,
			_profile_report,
		);
	} else if (_post_report) {
		_type = "post";
		_report = await retrieveCleanPostReport(event, identity, _post_report);
	} else if (_whisper_report) {
		_type = "whisper";
		_report = await retrieveCleanWhisperReport(
			event,
			identity,
			_whisper_report,
		);
	}

	if (!_report) {
		throw createError({
			statusCode: 404,
			statusMessage: "Report not found",
		});
	}

	await db
		.update(
			_type === "profile"
				? profileReports
				: _type === "post"
					? postReports
					: whisperReports,
		)
		.set({ status })
		.where(
			eq(
				_type === "profile"
					? profileReports.id
					: _type === "post"
						? postReports.id
						: whisperReports.id,
				id,
			),
		)
		.execute();

	const [reporterProfile] = await db
	.select({ id: profiles.id, accountId: profiles.accountId })
		.from(profiles)
		.where(eq(profiles.accountId, _report.reporter.id))
		.limit(1);

	if (!reporterProfile) {
		throw createError({
			statusCode: 500,
			statusMessage: "Reporter profile not found",
		});
	}

	const [existingNotification] = await db
		.select()
		.from(notifications)
		.where(
			eq(
				_type === "profile"
					? notifications.profileReportId
					: _type === "post"
						? notifications.postReportId
						: notifications.whisperReportId,
				_report.id,
			),
		)
		.limit(1);

	if (existingNotification) {
		await db
			.update(notifications)
			.set({ type: status === "rejected" ? "report.rejected" : "report.actioned", readAt: null })
			.where(eq(notifications.id, existingNotification.id));
	} else {
		await db.insert(notifications).values({
			accountId: reporterProfile.accountId,
			profileId: reporterProfile.id,
			profileReportId: _type === "profile" ? _report.id : null,
			postReportId: _type === "post" ? _report.id : null,
			whisperReportId: _type === "whisper" ? _report.id : null,
			type: status === "rejected" ? "report.rejected" : "report.actioned",
			data: {
				reportKind: _type,
				reason: _report.reason,
				note: _report.details ?? null,
			},
		});
	}

	return {
		status: "ok",
		type: _type,
		report: _report,
	};
});
