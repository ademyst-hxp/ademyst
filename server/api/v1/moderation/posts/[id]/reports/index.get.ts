import { H3Event } from "h3";

import { createDb } from "~~/server/db";
import { eq } from "drizzle-orm";
import { postReports } from "~~/server/db/schema/reports";

import { normalizeId } from "~~/server/utils/normalizers/ids";

import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const identity = await requireAuth(event);

		const postId = normalizeId(event.context.params?.id);

		if (!postId) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid post id",
			});
		}

		const dbReports = await db
			.select()
			.from(postReports)
			.where(eq(postReports.reportedPostId, postId));

		const reports = await retrieveSeveralCleanPostReports(
			event,
			identity,
			dbReports,
		);

		return {
			status: "ok",
			reports,
		};
	} finally {
		await client.end();
	}
});
