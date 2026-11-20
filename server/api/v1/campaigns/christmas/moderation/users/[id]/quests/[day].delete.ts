import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";

import { christmasQuestCompletions as questCompletions } from "~~/server/db/schema/campaigns/christmas";

import { requireQuestDay } from "~~/server/utils/helpers/christmas";
import { requireAuth } from "#server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";

import type { H3Event } from "h3";

/*
 * Retire la validation d'une quête pour un profil (niveau 8+) : triche,
 * validation accordée par erreur. Les points du profil baissent d'autant dans
 * le classement.
 *
 * Idempotent : `deleted` vaut false s'il n'y avait rien à retirer.
 * Attention : un badge déjà distribué par le cron n'est PAS retiré (à faire
 * via DELETE /users/[name]/badges/[badgeId]).
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

	const removed = await db
		.delete(questCompletions)
		.where(
			and(
				eq(questCompletions.profileId, id),
				eq(questCompletions.questId, day),
			),
		)
		.returning({ id: questCompletions.id });

	console.info(
		JSON.stringify({
			event: "christmas.moderation.revoke",
			day,
			profile: id,
			issuer: identity.profileId,
			deleted: removed.length > 0,
		}),
	);

	return {
		status: "ok",
		deleted: removed.length > 0,
	};
});
