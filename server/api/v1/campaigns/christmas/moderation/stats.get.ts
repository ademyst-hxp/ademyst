import { useDb } from "#server/db";
import { asc, count, countDistinct, eq, sql } from "drizzle-orm";

import {
	christmasQuests as quests,
	christmasQuestCompletions as questCompletions,
} from "~~/server/db/schema/campaigns/christmas";

import { BADGE_REWARDS } from "~~/cron/christmas";
import {
	CHRISTMAS_YEAR,
	currentQuestDay,
} from "~~/server/jobs/campaigns/christmas";
import { buildScores } from "~~/server/utils/helpers/christmas";
import { requireAuth } from "#server/utils/middleware/auth";

import type { H3Event } from "h3";
import type { ModerationStatsResponse } from "~~/shared/models/campaigns/christmas";

/*
 * Vue d'ensemble de la campagne pour l'équipe (niveau 6+).
 *
 * `rewards` est un "dry-run" en direct du cron de distribution des badges :
 * combien de profils sont éligibles à chaque badge à cet instant, avec les
 * mêmes seuils (BADGE_REWARDS) et les mêmes points.
 */
export default defineEventHandler(
	async (event: H3Event): Promise<ModerationStatsResponse> => {
		const db = useDb(event);

		await requireAuth(event, { min_level: 6 });

		const { completed, scores } = buildScores(db);

		// Un compteur par badge : count(*) filter (where points >= seuil).
		// Seuils = constantes du code, sql.raw est sûr.
		const eligible = sql<Record<string, number>>`jsonb_build_object(${sql.join(
			BADGE_REWARDS.flatMap((reward) => [
				sql.raw(`'${reward.badgeId}'`),
				sql<number>`(count(*) filter (where ${scores.points} >= ${sql.raw(
					String(Number(reward.minPoints)),
				)}))::int`,
			]),
			sql.raw(", "),
		)})`;

		const [days, [overall]] = await Promise.all([
			db
				.select({
					day: quests.id,
					level: quests.level,
					title: quests.title,
					// Unique (profil, quête) : profils distincts = validations.
					completions: countDistinct(questCompletions.profileId),
				})
				.from(quests)
				.leftJoin(
					questCompletions,
					eq(questCompletions.questId, quests.id),
				)
				.groupBy(quests.id)
				.orderBy(asc(quests.id)),

			db
				.with(completed, scores)
				.select({
					participants: count(),
					maxPoints: sql<number>`coalesce(max(${scores.points}), 0)::int`,
					averagePoints: sql<number>`coalesce(round(avg(${scores.points}), 1), 0)::float8`,
					eligible,
				})
				.from(scores),
		]);

		return {
			status: "ok",
			campaign: { year: CHRISTMAS_YEAR, today: currentQuestDay() },
			participants: overall?.participants ?? 0,
			totalCompletions: days.reduce(
				(sum, row) => sum + row.completions,
				0,
			),
			points: {
				max: overall?.maxPoints ?? 0,
				average: overall?.averagePoints ?? 0,
			},
			rewards: BADGE_REWARDS.map((reward) => ({
				badgeId: reward.badgeId,
				minPoints: reward.minPoints,
				years: reward.years,
				eligible: Number(
					overall?.eligible[reward.badgeId] ?? 0,
				),
			})),
			days,
		};
	},
);
