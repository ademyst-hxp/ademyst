import { createError, readBody, type H3Event } from "h3";

import { createDb } from "#server/db";
import { postReports } from "#server/db/schema/reports";

import { normalizeId } from "#server/utils/normalizers/ids";
import {
	normalizeOptionalText,
	normalizeRequiredText,
} from "~~/server/utils/normalizers/interactions";
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

		const body = await readBody(event);
		const reason = normalizeRequiredText(body?.reason);
		const details = normalizeOptionalText(body?.details);

		if (!reason) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid report payload",
			});
		}

		await db.insert(postReports).values({
			reporterId: identity.accountId,
			reportedPostId: postId,
			reason,
			details,
		});

		return { status: "ok" };
	} finally {
		await client.end();
	}
});
