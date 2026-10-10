import type { H3Event } from "h3";

import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";

import { whisperReactions } from "#server/db/schema/interactions";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const whisperId = normalizeId(event.context.params?.id);

	if (!whisperId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid whisper id",
		});
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(whisperReactions)
			.where(
				and(
					eq(whisperReactions.whisperId, whisperId),
					eq(whisperReactions.profileId, identity.profileId),
				),
			);

		await tx.insert(whisperReactions).values({
			whisperId,
			profileId: identity.profileId,
			reaction: "like",
		});
	});

	return { status: "ok", liked: true };
});
