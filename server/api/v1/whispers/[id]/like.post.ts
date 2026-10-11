import type { H3Event } from "h3";

import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";

import { whisperReactions, whispers } from "#server/db/schema/interactions";
import { whisperNotifications } from "#server/db/schema/inbox";

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
		const [whisper] = await tx
			.select({ profileId: whispers.profileId })
			.from(whispers)
			.where(eq(whispers.id, whisperId))
			.limit(1);

		if (!whisper) {
			throw createError({
				statusCode: 404,
				statusMessage: "Whisper not found",
			});
		}

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

		await tx
			.delete(whisperNotifications)
			.where(
				and(
					eq(whisperNotifications.whisperId, whisperId),
					eq(whisperNotifications.issuerId, identity.profileId),
					eq(whisperNotifications.type, "reaction"),
				),
			);

		if (whisper.profileId !== identity.profileId) {
			await tx.insert(whisperNotifications).values({
				profileId: whisper.profileId,
				issuerId: identity.profileId,
				whisperId,
				type: "reaction",
			});
		}
	});

	return { status: "ok", liked: true };
});
