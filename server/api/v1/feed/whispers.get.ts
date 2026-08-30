import { desc, gt } from "drizzle-orm";

import { createDb } from "#server/db";
import { whispers } from "#server/db/schema/interactions";

import { requireAuth } from "#server/utils/middleware/auth";
import { retrieveSeveralCleanWhispers } from "#server/utils/converters/interactions";

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const identity = await requireAuth(event);

		const query = getQuery(event);

		const limit = Math.min(Number(query.limit) || 100, 100);
		const offset = Math.max(Number(query.offset) || 0, 0);

		const rawWhispers = await db
			.select()
			.from(whispers)
			.where(
				gt(
					whispers.createdAt,
					new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
				),
			)
			.orderBy(desc(whispers.createdAt))
			.limit(limit)
			.offset(offset);

		const resolvedWhispers = await retrieveSeveralCleanWhispers(
			event,
			identity,
			rawWhispers,
		);

		const filteredWhispers = resolvedWhispers.filter(
			(whisper): whisper is NonNullable<typeof whisper> =>
				whisper !== null,
		);

		return {
			status: "ok",
			whispers: filteredWhispers,
			next: offset + limit,
			hasNext: rawWhispers.length === limit,
		};
	} finally {
		await client.end();
	}
});
