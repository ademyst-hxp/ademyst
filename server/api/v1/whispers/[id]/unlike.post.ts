import { useDb } from "#server/db";
import { whisperNotifications } from "#server/db/schema/inbox";
import { whisperReactions } from "#server/db/schema/interactions";
import { and, eq } from "drizzle-orm";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";

import { createError } from "h3";

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

	await db
		.delete(whisperNotifications)
		.where(
			and(
				eq(whisperNotifications.whisperId, whisperId),
				eq(whisperNotifications.issuerId, identity.profileId),
				eq(whisperNotifications.type, "reaction"),
			),
		);

	return { status: "ok", liked: false };
});
