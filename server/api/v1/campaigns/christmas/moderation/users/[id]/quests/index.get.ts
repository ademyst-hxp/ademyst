import { useDb } from "#server/db";
import { profiles } from "#server/db/schema/profiles";
import { eq } from "drizzle-orm";

import { retrieveCleanProfile } from "~~/server/utils/converters/profiles";
import { getQuestsReport } from "~~/server/utils/helpers/christmas";
import { requireAuth } from "#server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";

import type { H3Event } from "h3";
import type { ModerationQuestsResponse } from "~~/shared/models/campaigns/christmas";

/*
 * Avancement d'un profil sur les quêtes, tel que la personne le voit (niveau
 * 6+), mais avec les quêtes à venir en clair. Utile pour le support :
 * « j'ai fait la quête mais elle n'est pas validée ».
 */
export default defineEventHandler(
	async (event: H3Event): Promise<ModerationQuestsResponse> => {
		const db = useDb(event);

		const id = normalizeId(event.context.params?.id);

		if (!id) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing user id",
			});
		}

		const identity = await requireAuth(event, { min_level: 6 });

		const [target] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, id))
			.limit(1);

		if (!target) {
			throw createError({
				statusCode: 404,
				statusMessage: "User not found",
			});
		}

		const [profile, report] = await Promise.all([
			retrieveCleanProfile(event, identity, target),
			getQuestsReport(event, target.id, { revealLocked: true }),
		]);

		return { status: "ok", profile, ...report };
	},
);
