import { useDb } from "#server/db";
import { profiles } from "#server/db/schema/profiles";
import { asc, count, eq } from "drizzle-orm";

import { getIdentity } from "#server/utils/auth";
import { retrieveSeveralCleanProfiles } from "~~/server/utils/converters/profiles";
import { buildRanking } from "~~/server/utils/helpers/christmas";
import { queryPagination } from "~~/server/utils/helpers/filters";

import type { H3Event } from "h3";
import type {
	LeaderboardEntry,
	LeaderboardPosition,
	LeaderboardResponse,
} from "~~/shared/models/campaigns/christmas";

/*
 * Classement des Quêtes de Noël.
 *
 * Le calcul des points et du rang vit dans server/utils/helpers/christmas.ts
 * (partagé avec les statistiques de modération).
 *
 * Participant = profil ayant validé au moins une quête.
 * Égalité = même rang (1, 2, 2, 4) ; à rang égal, celui qui a atteint son
 * total le premier passe devant (ordre d'affichage uniquement, pas le rang).
 */

export default defineEventHandler(
	async (event: H3Event): Promise<LeaderboardResponse> => {
		const db = useDb(event);

		// Route publique : l'authentification est facultative et ne sert qu'à
		// retrouver la position de la personne (pas de 401 si absente).
		const identity = await getIdentity(event);

		const { limit, offset } = queryPagination(event, {
			defaultLimit: 50,
			maxLimit: 100,
		});

		const { completed, scores, ranked } = buildRanking(db);

		const [rows, [totalRow], [mine]] = await Promise.all([
			db
				.with(completed, scores, ranked)
				.select({
					profile: profiles,
					rank: ranked.rank,
					points: ranked.points,
					quests: ranked.quests,
				})
				.from(ranked)
				.innerJoin(profiles, eq(profiles.id, ranked.profileId))
				.orderBy(
					asc(ranked.rank),
					asc(ranked.reachedAt),
					asc(profiles.id),
				)
				.limit(limit)
				.offset(offset),

			db.with(completed, scores).select({ total: count() }).from(scores),

			identity
				? db
						.with(completed, scores, ranked)
						.select({
							rank: ranked.rank,
							points: ranked.points,
							quests: ranked.quests,
						})
						.from(ranked)
						.where(eq(ranked.profileId, identity.profileId))
						.limit(1)
				: Promise.resolve([] as never[]),
		]);

		const total = totalRow?.total ?? 0;

		// Profils nettoyés (vie privée, relations, badges) en une seule passe,
		// comme les autres listes de profils.
		const cleanProfiles = new Map(
			(
				await retrieveSeveralCleanProfiles(
					event,
					identity,
					rows.map((row) => row.profile),
				)
			).map((profile) => [profile.id, profile]),
		);

		const data: LeaderboardEntry[] = [];

		for (const row of rows) {
			const profile = cleanProfiles.get(row.profile.id);

			if (!profile) continue;

			data.push({
				rank: row.rank,
				points: row.points,
				completedQuests: row.quests,
				profile,
			});
		}

		const me: LeaderboardPosition | null = mine
			? {
					rank: mine.rank,
					points: mine.points,
					completedQuests: mine.quests,
				}
			: null;

		return {
			status: "ok",
			total,
			data,
			me,
			next: offset + limit,
			hasNext: offset + rows.length < total,
		};
	},
);
