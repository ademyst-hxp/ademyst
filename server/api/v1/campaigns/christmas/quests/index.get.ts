import { requireAuth } from "#server/utils/middleware/auth";
import { setResponseHeaders } from "h3";

import { getQuestsReport } from "~~/server/utils/helpers/christmas";

import type { H3Event } from "h3";
import type { QuestsResponse } from "~~/shared/models/campaigns/christmas";

/*
 * Avancement de la personne connectée sur les 25 quêtes.
 *
 * Par quête : statut (locked | in_progress | completed | missed), date de
 * validation et progression (ex. 1/2 publications) pour la quête du jour.
 * Les quêtes à venir restent secrètes : ni titre ni description.
 */
export default defineEventHandler(
	async (event: H3Event): Promise<QuestsResponse> => {
		const identity = await requireAuth(event);

		setResponseHeaders(event, {
			"Cache-Control": "no-store, no-cache, must-revalidate, private",
			"Pragma": "no-cache",
			"Expires": "0",
		});

		const report = await getQuestsReport(event, identity.profileId, {
			revealLocked: false,
		});

		return { status: "ok", ...report };
	},
);
