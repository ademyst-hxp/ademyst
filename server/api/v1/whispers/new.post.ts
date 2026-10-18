import { useDb } from "#server/db";
import { whisperNotifications } from "#server/db/schema/inbox";
import { whispers } from "#server/db/schema/interactions";
import { follows } from "#server/db/schema/relations";
import { eq } from "drizzle-orm";

import { generateHexId } from "#server/utils/ids";
import { retrieveCleanWhisper } from "~~/server/utils/converters/interactions";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeOptionalText, normalizeVisibility } from "~~/server/utils/normalizers/interactions";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const body = await readBody(event);
	const content = normalizeOptionalText(body?.content) ?? "";
	const visibility = normalizeVisibility(body?.visibility) ?? "everyone";
	const textColor = body?.textColor ?? null;
	const color = body?.color ?? null;

	const id = generateHexId();

	const [createdWhisper] = await db
		.insert(whispers)
		.values({
			id,
			profileId: identity.profileId,
			content,
			visibility,
			textColor,
			color,
		})
		.returning();

	if (!createdWhisper) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to create whisper",
		});
	}

	if (visibility !== "me" && visibility !== "friends") {
		const followers = await db
			.select({ profileId: follows.followerId })
			.from(follows)
			.where(eq(follows.followingId, identity.profileId));

		if (followers.length > 0) {
			await db.insert(whisperNotifications).values(
				followers.map(({ profileId }) => ({
					profileId,
					issuerId: identity.profileId,
					whisperId: createdWhisper.id,
					type: "suggestion" as const,
				})),
			);
		}
	}

	const whisper = await retrieveCleanWhisper(event, identity, createdWhisper);

	return {
		status: "ok",
		data: whisper,
	};
});
