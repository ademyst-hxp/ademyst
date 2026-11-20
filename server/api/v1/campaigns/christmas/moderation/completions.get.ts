import { useDb } from "#server/db";
import { profiles } from "#server/db/schema/profiles";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import {
	christmasQuests as quests,
	christmasQuestCompletions as questCompletions,
} from "~~/server/db/schema/campaigns/christmas";

import { retrieveSeveralCleanProfiles } from "~~/server/utils/converters/profiles";
import {
	queryDate,
	queryInteger,
	queryPagination,
	queryText,
} from "~~/server/utils/helpers/filters";
import { requireAuth } from "#server/utils/middleware/auth";

import { LEVEL_REWARDS } from "~~/shared/models/campaigns/christmas";

import type { H3Event } from "h3";
import type {
	ModerationCompletion,
	ModerationCompletionsResponse,
} from "~~/shared/models/campaigns/christmas";

/*
 * Journal des validations de quêtes, les plus récentes d'abord (niveau 6+).
 * Sert à repérer des abus (rafale de validations) ou à vérifier un signalement.
 *
 * Filtres (tous facultatifs) :
 *   ?day=7                  quête (1-25)
 *   ?profile=<id de profil> un seul profil
 *   ?from=YYYY-MM-DD        validations depuis (jour UTC entier, ou ISO 8601)
 *   ?to=YYYY-MM-DD          validations jusqu'à
 *   ?limit & ?offset        pagination
 */
export default defineEventHandler(
	async (event: H3Event): Promise<ModerationCompletionsResponse> => {
		const db = useDb(event);

		const identity = await requireAuth(event, { min_level: 6 });

		const day = queryInteger(event, "day", { min: 1, max: 25 });
		const profileId = queryText(event, "profile", { maxLength: 10 });
		const from = queryDate(event, "from", "start");
		const to = queryDate(event, "to", "end");

		const { limit, offset } = queryPagination(event, { defaultLimit: 50 });

		const rows = await db
			.select({
				completion: questCompletions,
				quest: quests,
				profile: profiles,
			})
			.from(questCompletions)
			.innerJoin(quests, eq(quests.id, questCompletions.questId))
			.innerJoin(profiles, eq(profiles.id, questCompletions.profileId))
			.where(
				and(
					day !== undefined
						? eq(questCompletions.questId, day)
						: undefined,
					profileId
						? eq(questCompletions.profileId, profileId)
						: undefined,
					from ? gte(questCompletions.completedAt, from) : undefined,
					to ? lte(questCompletions.completedAt, to) : undefined,
				),
			)
			.orderBy(
				desc(questCompletions.completedAt),
				desc(questCompletions.id),
			)
			.limit(limit)
			.offset(offset);

		const cleanProfiles = new Map(
			(
				await retrieveSeveralCleanProfiles(event, identity, [
					...new Map(
						rows.map((row) => [row.profile.id, row.profile]),
					).values(),
				])
			).map((profile) => [profile.id, profile]),
		);

		const data: ModerationCompletion[] = [];

		for (const row of rows) {
			const profile = cleanProfiles.get(row.profile.id);

			if (!profile) continue;

			data.push({
				id: row.completion.id,
				day: row.quest.id,
				level: row.quest.level,
				title: row.quest.title,
				reward: LEVEL_REWARDS[row.quest.level],
				completedAt: row.completion.completedAt,
				profile,
			});
		}

		return {
			status: "ok",
			data,
			next: offset + limit,
			hasNext: rows.length === limit,
		};
	},
);
