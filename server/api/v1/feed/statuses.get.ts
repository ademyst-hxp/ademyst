import { desc } from "drizzle-orm/sql/expressions/select";

import { useDb } from "#server/db";
import { statuses } from "#server/db/schema/interactions";

import { requireAuth } from "#server/utils/middleware/auth";
import { retrieveCleanStatus } from "#server/utils/converters/interactions";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const query = getQuery(event);

	const limit = Math.min(Number(query.limit) || 100, 100);
	const offset = Math.max(Number(query.offset) || 0, 0);

	const rawStatuses = await db
		.select()
		.from(statuses)
		.orderBy(desc(statuses.createdAt))
		.limit(limit)
		.offset(offset);

	const resolvedStatuses = await Promise.all(
		rawStatuses.map(async (status) => {
			return await retrieveCleanStatus(identity, status);
		}),
	);

	const filteredStatuses = resolvedStatuses.filter(
		(status): status is NonNullable<typeof status> => status !== null,
	);

	return {
		status: "ok",
		statuses: filteredStatuses,
		next: offset + limit,
		hasNext: rawStatuses.length === limit,
	};
});
