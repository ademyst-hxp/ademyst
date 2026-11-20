import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { profiles } from "#server/db/schema/profiles";
import { whispers } from "#server/db/schema/interactions";
import { follows } from "#server/db/schema/relations";
import { eq } from "drizzle-orm";

import { generateHexId } from "#server/utils/ids";
import { retrieveCleanWhisper } from "~~/server/utils/converters/interactions";
import { triggerQuests } from "~~/server/jobs/campaigns/christmas";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeOptionalText, normalizeVisibility } from "~~/server/utils/normalizers/interactions";
import { getWhisperSpecs } from "~~/shared/utils/interactions";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const body = await readBody(event);
	const specs = getWhisperSpecs(identity.profile.level);

	const content = normalizeOptionalText(body?.content) ?? "";

	if (content.length > specs.max_length) {
		throw createError({
			statusCode: 400,
			statusMessage: `Whisper content exceeds maximum length of ${specs.max_length} characters`,
		});
	}

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
			.select({ profileId: follows.followerId, accountId: profiles.accountId })
			.from(follows)
			.innerJoin(profiles, eq(profiles.id, follows.followerId))
			.where(eq(follows.followingId, identity.profileId));

		if (followers.length > 0) {
			await db.insert(notifications).values(
				followers.map(({ profileId }) => ({
					accountId: followers.find((follower) => follower.profileId === profileId)!.accountId,
					profileId,
					actorId: identity.profileId,
					whisperId: createdWhisper.id,
					type: "content.whisper" as const,
					data: {},
				})),
			);
		}
	}

	// Quêtes de Noël : pensées (4, 11, 17, 21, 25)
	await triggerQuests(event, identity.profileId, [4, 11, 17, 21, 25]);

	const whisper = await retrieveCleanWhisper(event, identity, createdWhisper);

	return {
		status: "ok",
		data: whisper,
	};
});
