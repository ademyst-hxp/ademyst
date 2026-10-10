import { useDb } from "~~/server/db";

import { eq } from "drizzle-orm";

import {
	profileReports,
	postReports,
	whisperReports,
} from "~~/server/db/schema/reports";

import type {
	ProfileReport,
	PostReport,
	WhisperReport,
} from "~~/shared/models/reports";

import {
	retrieveCleanProfileReport,
	retrieveCleanPostReport,
	retrieveCleanWhisperReport,
} from "~~/server/utils/converters/reports";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const { id } = event.context.params as { id: string };

	const identity = await getIdentity(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const issuer = await getUser(event, identity);

	if (!issuer) {
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
		_report = await retrieveCleanPostReport(
			event,
			identity,
			_post_report,
		);
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

	if (
		_report.reporter.id !== issuer.account.id &&
		issuer.profile.level < 6
	) {
		throw createError({
			statusCode: 403,
			statusMessage: "Forbidden",
		});
	}

	return {
		status: "ok",
		type: _type,
		report: _report,
	};
});
