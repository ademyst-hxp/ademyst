import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { profiles } from "#server/db/schema/profiles";
import { whisperReactions, whispers } from "#server/db/schema/interactions";
import { and, eq } from "drizzle-orm";

import { normalizeId } from "#server/utils/normalizers/ids";
import { requireAuth } from "~~/server/utils/middleware/auth";

import type { H3Event } from "h3";

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
			.select({ profileId: whispers.profileId, accountId: profiles.accountId })
			.from(whispers)
			.innerJoin(profiles, eq(profiles.id, whispers.profileId))
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
			.delete(notifications)
			.where(
				and(
					eq(notifications.whisperId, whisperId),
					eq(notifications.actorId, identity.profileId),
					eq(notifications.type, "interaction.reaction"),
				),
			);

		if (whisper.profileId !== identity.profileId) {
			await tx.insert(notifications).values({
				accountId: whisper.accountId,
				profileId: whisper.profileId,
				actorId: identity.profileId,
				whisperId,
				type: "interaction.reaction",
				data: { reaction: "like" },
			});
		}
	});

	return { status: "ok", liked: true };
});
