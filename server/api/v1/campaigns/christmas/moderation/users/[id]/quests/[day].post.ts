import { useDb } from "#server/db";
import { profiles } from "#server/db/schema/profiles";
import { eq } from "drizzle-orm";

import {
	christmasQuests as quests,
	christmasQuestCompletions as questCompletions,
} from "~~/server/db/schema/campaigns/christmas";

import { requireQuestDay } from "~~/server/utils/helpers/christmas";
import { requireAuth } from "#server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";

import type { H3Event } from "h3";

/*
 * Valide une quête à la main pour un profil (niveau 8+) : geste commercial
 * après un bug, par exemple. Ignore la règle « pendant son jour ».
 *
 * Idempotent : `created` vaut false si la quête était déjà validée.
 * Attention : une validation ajoutée après la distribution des badges
 * (cron du 24/12 à 23:59 UTC) ne déclenche aucun badge.
 */
export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const id = normalizeId(event.context.params?.id);
	const day = requireQuestDay(event.context.params?.day);

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing user id",
		});
	}

	const identity = await requireAuth(event, { min_level: 8 });

	const [[target], [quest]] = await Promise.all([
		db
			.select({ id: profiles.id })
			.from(profiles)
			.where(eq(profiles.id, id))
			.limit(1),
		db
			.select({ id: quests.id })
			.from(quests)
			.where(eq(quests.id, day))
			.limit(1),
	]);

	if (!target) {
		throw createError({
			statusCode: 404,
			statusMessage: "User not found",
		});
	}

	if (!quest) {
		throw createError({
			statusCode: 404,
			statusMessage: "Quest not found",
		});
	}

	// (profile_id, quest_id) est unique : un doublon est ignoré.
	const [inserted] = await db
		.insert(questCompletions)
		.values({ profileId: target.id, questId: quest.id })
		.onConflictDoNothing()
		.returning({ completedAt: questCompletions.completedAt });

	console.info(
		JSON.stringify({
			event: "christmas.moderation.validate",
			day: quest.id,
			profile: target.id,
			issuer: identity.profileId,
			created: !!inserted,
		}),
	);

	return {
		status: "ok",
		created: !!inserted,
		completedAt: inserted?.completedAt ?? null,
	};
});
