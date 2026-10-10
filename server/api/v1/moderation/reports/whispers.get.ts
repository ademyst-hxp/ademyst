import { useDb } from "~~/server/db";

import { whisperReports } from "~~/server/db/schema/reports";

import { retrieveSeveralCleanWhisperReports } from "~~/server/utils/converters/reports";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 7 });

	const limit = Number(event.context.query?.limit) || 100;
	const offset = Number(event.context.query?.offset) || 0;

	const _whisper_reports = await db
		.select()
		.from(whisperReports)
		.limit(limit)
		.offset(offset);

	return {
		status: "ok",
		reports: await retrieveSeveralCleanWhisperReports(
			event,
			identity,
			_whisper_reports,
		),
		next: offset + limit,
		hasNext: _whisper_reports.length === limit,
	};
});
