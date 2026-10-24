import { useDb } from "#server/db";
import { whispers } from "#server/db/schema/interactions";
import { desc } from "drizzle-orm/sql/expressions/select";

import { retrieveSeveralCleanWhispers } from "#server/utils/converters/interactions";
import { requireAuth } from "#server/utils/middleware/auth";

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

	const resolvedWhispers = await retrieveSeveralCleanWhispers(
		event,
		identity,
		rawWhispers,
	);

	const filteredWhispers = resolvedWhispers
		.filter(
			(whisper): whisper is NonNullable<typeof whisper> =>
				whisper !== null,
		)
		.filter((whisper) => whisper.profile.level >= 3)
		.sort((a, b) => {
			return b.createdAt.getTime() - a.createdAt.getTime();
		});

	return {
		status: "ok",
		whispers: filteredWhispers,
		next: offset + limit,
		hasNext: filteredWhispers.length === limit,
	};
});
