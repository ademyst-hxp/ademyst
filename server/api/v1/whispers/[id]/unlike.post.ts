import { createError } from "h3";

import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";

import { whisperReactions } from "#server/db/schema/interactions";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);
	const whisperId = normalizeId(event.context.params?.id);

	if (!whisperId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid whisper id",
		});
	}

	await db
		.delete(whisperReactions)
		.where(
			and(
				eq(whisperReactions.whisperId, whisperId),
				eq(whisperReactions.profileId, identity.profileId),
			),
		);

	return { status: "ok", liked: false };
});
