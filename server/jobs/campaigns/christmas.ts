import type { H3Event } from "h3";

import { useDb } from "~~/server/db";
import {
	and,
	count,
	countDistinct,
	eq,
	gte,
	inArray,
	isNotNull,
	lt,
	sql,
} from "drizzle-orm";

import {
	christmasQuests as quests,
	christmasQuestCompletions as questCompletions,
} from "~~/server/db/schema/campaigns/christmas";

import {
	posts,
	postReactions,
	postsFlags,
	whispers,
} from "~~/server/db/schema/interactions";

import { attachments } from "~~/server/db/schema/drive";

import { referrals, referralCodes } from "~~/server/db/schema/referrals";

import { getWhisperHue } from "~~/shared/consts/whispers";
import { calculateRatingScore } from "~~/shared/utils/interactions";

import type { Profile } from "~~/shared/models/profiles";
import type { PostFlagType } from "~~/shared/models/interactions";
import type {
	Quest,
	QuestProgress,
} from "~~/shared/models/campaigns/christmas";

/*
 * Règles communes à toutes les quêtes
 *
 *  - Une quête ne se valide que PENDANT son jour : un déclenchement n'est pris
 *    en compte que si la date du jour (UTC) est celle de la quête.
 *  - "Le jour D" = [D 00:00 UTC, D+1 00:00 UTC). Les colonnes `timestamp` de
 *    la base sont en UTC : on compare toujours avec une plage, jamais avec un
 *    `eq` sur minuit (qui ne correspond à aucune ligne).
 *  - La visibilité d'une publication ou d'une pensée n'a aucun impact.
 *  - Un trigger ne doit jamais faire échouer l'action de l'utilisateur :
 *    les endpoints passent par triggerQuests(), qui attrape les erreurs.
 */

export const CHRISTMAS_YEAR = 2026;

// Seuil du score de classement pour compter comme "hit beam" (quête 20).
// Score calculé SANS l'ethos (niveau du compte) : voir calculateRatingScore.
const HIT_BEAM_MIN_SCORE = 100;

/** Jour de quête (1-25) pour la date donnée, ou null hors campagne. */
export function currentQuestDay(now: Date = new Date()): number | null {
	if (now.getUTCFullYear() !== CHRISTMAS_YEAR || now.getUTCMonth() !== 11)
		return null;

	const day = now.getUTCDate();

	return day >= 1 && day <= 25 ? day : null;
}

export const dayStart = (day: number) =>
	new Date(Date.UTC(CHRISTMAS_YEAR, 11, day));
export const dayEnd = (day: number) =>
	new Date(Date.UTC(CHRISTMAS_YEAR, 11, day + 1));
export const dayUnlock = (day: number) =>
	new Date(dayStart(day).getTime() - 4 * 60 * 60 * 1000);

type Db = ReturnType<typeof useDb>;

async function validateQuest(db: Db, day: Quest["id"], profile: Profile["id"]) {
	const [quest] = await db
		.select({ id: quests.id })
		.from(quests)
		.where(eq(quests.id, day))
		.limit(1);

	if (!quest) {
		throw new Error(`Quest with day ${day} does not exist`);
	}

	// Idempotent : (profile_id, quest_id) est unique, un doublon est ignoré.
	await db
		.insert(questCompletions)
		.values({ profileId: profile, questId: day })
		.onConflictDoNothing();
}

/** Nombre de publications de l'auteur ce jour-là qui respectent `extra`. */
async function countPostsOfDay(
	db: Db,
	profile: Profile["id"],
	day: number,
	extra?: ReturnType<typeof sql>,
): Promise<number> {
	const [row] = await db
		.select({ n: count() })
		.from(posts)
		.where(
			and(
				eq(posts.profileId, profile),
				gte(posts.createdAt, dayStart(day)),
				lt(posts.createdAt, dayEnd(day)),
				extra,
			),
		);

	return row?.n ?? 0;
}

async function countDistinctReactedPostsOfDay(
	db: Db,
	profile: Profile["id"],
	day: number,
): Promise<number> {
	// Distinct : liker / déliker / reliker la même publication ne compte qu'une fois.
	const [row] = await db
		.select({ n: countDistinct(postReactions.postId) })
		.from(postReactions)
		.where(
			and(
				eq(postReactions.profileId, profile),
				gte(postReactions.createdAt, dayStart(day)),
				lt(postReactions.createdAt, dayEnd(day)),
			),
		);

	return row?.n ?? 0;
}

async function getWhispersOfDay(db: Db, profile: Profile["id"], day: number) {
	return db
		.select()
		.from(whispers)
		.where(
			and(
				eq(whispers.profileId, profile),
				gte(whispers.createdAt, dayStart(day)),
				lt(whispers.createdAt, dayEnd(day)),
			),
		);
}

const CHRISTMAS_WORDS = /no[ëe]l|christmas|🎄|🎅|🤶|⛄|☃|❄|🎁|🦌/i;

async function isCompleted(
	db: Db,
	day: Quest["id"],
	profile: Profile["id"],
): Promise<boolean> {
	switch (day) {
		// 1 : 2 publications
		case 1: {
			return (await countPostsOfDay(db, profile, day)) >= 2;
		}

		// 7 : 1 publication d'au moins 300 caractères
		case 7: {
			return (
				(await countPostsOfDay(
					db,
					profile,
					day,
					sql`char_length(${posts.content}) >= 300`,
				)) >= 1
			);
		}

		// 15 : 1 publication d'au moins 500 caractères
		case 15: {
			return (
				(await countPostsOfDay(
					db,
					profile,
					day,
					sql`char_length(${posts.content}) >= 500`,
				)) >= 1
			);
		}

		// 12, 16, 22 : 1 publication
		case 12:
		case 16:
		case 22: {
			return (await countPostsOfDay(db, profile, day)) >= 1;
		}

		// 19 : 1 publication avec le flag "humour" (joke)
		case 19: {
			const [row] = await db
				.select({ n: countDistinct(posts.id) })
				.from(posts)
				.innerJoin(postsFlags, eq(postsFlags.postId, posts.id))
				.where(
					and(
						eq(posts.profileId, profile),
						eq(postsFlags.type, "joke"),
						gte(posts.createdAt, dayStart(day)),
						lt(posts.createdAt, dayEnd(day)),
					),
				);

			return (row?.n ?? 0) >= 1;
		}

		// 3 : réagir à 5 publications
		case 3: {
			return (
				(await countDistinctReactedPostsOfDay(db, profile, day)) >= 5
			);
		}

		// 18, 24 : réagir à 3 publications
		case 18:
		case 24: {
			return (
				(await countDistinctReactedPostsOfDay(db, profile, day)) >= 3
			);
		}

		// 5 : 2 publications avec au moins un lien
		case 5: {
			const [row] = await db
				.select({ n: countDistinct(attachments.postId) })
				.from(attachments)
				.where(
					and(
						eq(attachments.authorId, profile),
						eq(attachments.type, "link"),
						isNotNull(attachments.postId),
						gte(attachments.createdAt, dayStart(day)),
						lt(attachments.createdAt, dayEnd(day)),
					),
				);

			return (row?.n ?? 0) >= 2;
		}

		// 8 : 1 publication avec au moins 2 liens
		case 8: {
			const rows = await db
				.select({ postId: attachments.postId, n: count() })
				.from(attachments)
				.where(
					and(
						eq(attachments.authorId, profile),
						eq(attachments.type, "link"),
						isNotNull(attachments.postId),
						gte(attachments.createdAt, dayStart(day)),
						lt(attachments.createdAt, dayEnd(day)),
					),
				)
				.groupBy(attachments.postId);

			return rows.some((row) => row.n >= 2);
		}

		// 10 : un parrainage confirmé ce jour-là (côté parrain)
		case 10: {
			const [row] = await db
				.select({ n: count() })
				.from(referrals)
				.innerJoin(
					referralCodes,
					eq(referrals.code, referralCodes.code),
				)
				.where(
					and(
						eq(referralCodes.authorId, profile),
						eq(referrals.confirmed, true),
						gte(referrals.confirmedAt, dayStart(day)),
						lt(referrals.confirmedAt, dayEnd(day)),
					),
				);

			return (row?.n ?? 0) >= 1;
		}

		// 11 : une pensée de couleur rouge
		case 11: {
			const rows = await getWhispersOfDay(db, profile, day);

			return rows.some(
				(whisper) => getWhisperHue(whisper.color) === "red",
			);
		}

		// 17 : deux pensées de couleurs différentes
		case 17: {
			const rows = await getWhispersOfDay(db, profile, day);

			const hues = new Set(
				rows
					.map((whisper) => getWhisperHue(whisper.color))
					.filter((hue) => hue !== null),
			);

			return hues.size >= 2;
		}

		// 21 : une pensée dorée
		case 21: {
			const rows = await getWhispersOfDay(db, profile, day);

			return rows.some(
				(whisper) => getWhisperHue(whisper.color) === "gold",
			);
		}

		// 25 : une pensée de Noël (contenu festif)
		case 25: {
			const rows = await getWhispersOfDay(db, profile, day);

			return rows.some((whisper) =>
				CHRISTMAS_WORDS.test(whisper.content),
			);
		}

		// 20 : un hit beam (score de classement ≥ seuil, ethos exclu)
		case 20: {
			const candidates = await db
				.select()
				.from(posts)
				.where(
					and(
						eq(posts.profileId, profile),
						// Le hit beam ne liste que les publications publiques.
						eq(posts.visibility, "everyone"),
						gte(posts.createdAt, dayStart(day)),
						lt(posts.createdAt, dayEnd(day)),
					),
				);

			if (!candidates.length) return false;

			const ids = candidates.map((post) => post.id);

			const [likes, answers, flags] = await Promise.all([
				db
					.select({ postId: postReactions.postId, n: count() })
					.from(postReactions)
					.where(inArray(postReactions.postId, ids))
					.groupBy(postReactions.postId),
				db
					.select({ postId: posts.parentId, n: count() })
					.from(posts)
					.where(inArray(posts.parentId, ids))
					.groupBy(posts.parentId),
				db
					.select({
						postId: postsFlags.postId,
						type: postsFlags.type,
					})
					.from(postsFlags)
					.where(inArray(postsFlags.postId, ids)),
			]);

			const likesOf = new Map(likes.map((row) => [row.postId, row.n]));
			const answersOf = new Map(
				answers.map((row) => [row.postId, row.n]),
			);

			return candidates.some((post) => {
				const postFlags: Record<PostFlagType, boolean> = {
					NFE: false,
					AI: false,
					joke: false,
					misinformation: false,
					spam: false,
					suspicious: false,
					suicide: false,
					reported: false,
				};

				for (const flag of flags)
					if (flag.postId === post.id) postFlags[flag.type] = true;

				// Exclus du hit beam (cf. feed/posts/hits.get.ts)
				if (
					postFlags.spam ||
					postFlags.NFE ||
					postFlags.AI ||
					postFlags.misinformation
				)
					return false;

				const score = calculateRatingScore(
					post.createdAt,
					post.content,
					// Niveau sans effet : l'ethos est ignoré ci-dessous.
					0,
					{
						reactions: { like: likesOf.get(post.id) ?? 0 },
						answers: answersOf.get(post.id) ?? 0,
					},
					postFlags,
					{ ethosMultiplier: true },
				);

				return score >= HIT_BEAM_MIN_SCORE;
			});
		}

		/*
		 * Quêtes validées par l'action elle-même : l'appel du trigger
		 * (depuis l'endpoint concerné) EST la preuve, rien à recompter.
		 *   2  répondre à une publication      (posts/new, parentId renseigné)
		 *   4  partager une pensée             (whispers/new)
		 *   6  mettre à jour son profil        (profile, liens, avatar)
		 *   9  visiter le profil de @ghost     (users/[name])
		 *   13 consulter les stats d'un post   (posts/[id], context=statistics)
		 *   14 jour de grève                   (auth/me, simple connexion)
		 *   23 suivre un nouveau profil        (users/[name]/follow)
		 */
		default:
			return true;
	}
}

/**
 * Évalue la quête `day` pour ce profil et l'enregistre si elle est remplie.
 * Sans effet si `day` n'est pas le jour courant (UTC).
 */
export async function triggerQuestUpdate(
	event: H3Event,
	day: Quest["id"],
	profile: Profile["id"],
): Promise<void> {
	if (currentQuestDay() !== day) return;

	const db = useDb(event);

	if (await isCompleted(db, day, profile))
		await validateQuest(db, day, profile);
}

/**
 * Point d'entrée des endpoints : `days` liste les quêtes que l'action peut
 * faire avancer ; seule celle du jour est évaluée. Ne lève jamais d'erreur :
 * un souci de quête ne doit pas casser une publication ou un like.
 *
 * À appeler APRÈS la transaction de l'endpoint (une seule connexion par requête).
 */
export async function triggerQuests(
	event: H3Event,
	profile: Profile["id"],
	days: Quest["id"][],
): Promise<void> {
	const today = currentQuestDay();

	if (today === null || !days.includes(today)) return;

	try {
		await triggerQuestUpdate(event, today, profile);
	} catch (error) {
		console.error(
			JSON.stringify({
				event: "christmas.trigger.failed",
				day: today,
				profile,
				error: error instanceof Error ? error.message : String(error),
			}),
		);
	}
}

/*
 * Progression d'une quête (affichée par GET /campaigns/christmas/quests).
 *
 * ATTENTION : miroir de isCompleted() ci-dessus. Si le critère d'une quête
 * change là-bas, il doit changer ici (seuil dans QUEST_TARGETS, mesure dans
 * measureQuest). isCompleted() reste la seule fonction qui VALIDE une quête :
 * ce qui suit ne sert qu'à l'affichage et n'écrit rien.
 */

/** Valeur à atteindre par quête ; 1 par défaut (quêtes "oui / non"). */
const QUEST_TARGETS: Record<number, number> = {
	1: 2, // 2 publications
	3: 5, // réagir à 5 publications
	5: 2, // 2 publications avec un lien
	8: 2, // 2 liens dans une même publication
	17: 2, // 2 pensées de couleurs différentes
	18: 3, // réagir à 3 publications
	24: 3, // réagir à 3 publications
};

export const questTarget = (day: Quest["id"]): number =>
	QUEST_TARGETS[day] ?? 1;

// Validées par l'action elle-même (cf. isCompleted) : rien à mesurer en base,
// la progression est 0 tant que la complétion n'est pas enregistrée.
const ACTION_QUESTS = new Set([2, 4, 6, 9, 13, 14, 23]);

async function measureQuest(
	db: Db,
	day: Quest["id"],
	profile: Profile["id"],
): Promise<number> {
	switch (day) {
		case 1:
		case 12:
		case 16:
		case 22:
			return countPostsOfDay(db, profile, day);

		case 7:
			return countPostsOfDay(
				db,
				profile,
				day,
				sql`char_length(${posts.content}) >= 300`,
			);

		case 15:
			return countPostsOfDay(
				db,
				profile,
				day,
				sql`char_length(${posts.content}) >= 500`,
			);

		case 19: {
			const [row] = await db
				.select({ n: countDistinct(posts.id) })
				.from(posts)
				.innerJoin(postsFlags, eq(postsFlags.postId, posts.id))
				.where(
					and(
						eq(posts.profileId, profile),
						eq(postsFlags.type, "joke"),
						gte(posts.createdAt, dayStart(day)),
						lt(posts.createdAt, dayEnd(day)),
					),
				);

			return row?.n ?? 0;
		}

		case 3:
		case 18:
		case 24:
			return countDistinctReactedPostsOfDay(db, profile, day);

		case 5: {
			const [row] = await db
				.select({ n: countDistinct(attachments.postId) })
				.from(attachments)
				.where(
					and(
						eq(attachments.authorId, profile),
						eq(attachments.type, "link"),
						isNotNull(attachments.postId),
						gte(attachments.createdAt, dayStart(day)),
						lt(attachments.createdAt, dayEnd(day)),
					),
				);

			return row?.n ?? 0;
		}

		case 8: {
			const rows = await db
				.select({ postId: attachments.postId, n: count() })
				.from(attachments)
				.where(
					and(
						eq(attachments.authorId, profile),
						eq(attachments.type, "link"),
						isNotNull(attachments.postId),
						gte(attachments.createdAt, dayStart(day)),
						lt(attachments.createdAt, dayEnd(day)),
					),
				)
				.groupBy(attachments.postId);

			// Meilleure publication du jour
			return rows.reduce((best, row) => Math.max(best, row.n), 0);
		}

		case 10: {
			const [row] = await db
				.select({ n: count() })
				.from(referrals)
				.innerJoin(
					referralCodes,
					eq(referrals.code, referralCodes.code),
				)
				.where(
					and(
						eq(referralCodes.authorId, profile),
						eq(referrals.confirmed, true),
						gte(referrals.confirmedAt, dayStart(day)),
						lt(referrals.confirmedAt, dayEnd(day)),
					),
				);

			return row?.n ?? 0;
		}

		case 11:
		case 21: {
			const wanted = day === 11 ? "red" : "gold";
			const rows = await getWhispersOfDay(db, profile, day);

			return rows.some(
				(whisper) => getWhisperHue(whisper.color) === wanted,
			)
				? 1
				: 0;
		}

		case 17: {
			const rows = await getWhispersOfDay(db, profile, day);

			return new Set(
				rows
					.map((whisper) => getWhisperHue(whisper.color))
					.filter((hue) => hue !== null),
			).size;
		}

		case 25: {
			const rows = await getWhispersOfDay(db, profile, day);

			return rows.some((whisper) => CHRISTMAS_WORDS.test(whisper.content))
				? 1
				: 0;
		}

		// Hit beam : score calculé, pas de compteur intermédiaire à afficher.
		case 20:
			return (await isCompleted(db, day, profile)) ? 1 : 0;

		default:
			return 0;
	}
}

/**
 * Avancement de `profile` sur la quête `day`, plafonné à l'objectif.
 * Ne vaut que pour le jour courant : les mesures se font sur la plage UTC du
 * jour, et les pensées sont purgées au bout de 24 h.
 */
export async function getQuestProgress(
	db: Db,
	day: Quest["id"],
	profile: Profile["id"],
): Promise<QuestProgress> {
	const target = questTarget(day);

	if (ACTION_QUESTS.has(day)) return { current: 0, target };

	return {
		current: Math.min(await measureQuest(db, day, profile), target),
		target,
	};
}
