import { desc } from "drizzle-orm/sql/expressions/select";

import { useDb } from "#server/db";
import { whispers } from "#server/db/schema/interactions";

import { requireAuth } from "#server/utils/middleware/auth";
import { retrieveCleanWhisper } from "#server/utils/converters/interactions";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const query = getQuery(event);

	const limit = Math.min(Number(query.limit) || 100, 100);
	const offset = Math.max(Number(query.offset) || 0, 0);

	const rawWhispers = await db
		.select()
		.from(whispers)
		.orderBy(desc(whispers.createdAt))
		.limit(limit)
		.offset(offset);

	const resolvedWhispers = await Promise.all(
		rawWhispers.map(async (whisper) => {
			return await retrieveCleanWhisper(event, identity, whisper);
		}),
	);

	const filteredWhispers = resolvedWhispers.filter(
		(whisper): whisper is NonNullable<typeof whisper> => whisper !== null,
	);

	return {
		status: "ok",
		whispers: filteredWhispers,
		next: offset + limit,
		hasNext: rawWhispers.length === limit,
	};
});
