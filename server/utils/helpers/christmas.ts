import { useDb } from "#server/db";
import { asc, eq, min, count, sql } from "drizzle-orm";

import {
	christmasQuests as quests,
	christmasQuestCompletions as questCompletions,
} from "~~/server/db/schema/campaigns/christmas";

import {
	CHRISTMAS_YEAR,
	currentQuestDay,
	dayEnd,
	dayStart,
	dayUnlock,
	getQuestProgress,
	questTarget,
} from "~~/server/jobs/campaigns/christmas";

import { LEVEL_REWARDS } from "~~/shared/models/campaigns/christmas";

import type { H3Event } from "h3";
import type { Profile } from "~~/shared/models/profiles";
import type {
	QuestProgress,
	QuestsReport,
	QuestState,
	QuestStatus,
} from "~~/shared/models/campaigns/christmas";

/*
 * Points : source unique pour le classement et les statistiques.
 *
 * Les points ne sont pas stockés : ils se déduisent de
 * `christmas_quest_completions` (source de vérité, cf. cron/christmas.ts) en
 * additionnant la récompense du niveau de chaque quête validée. Même
 * définition que le cron qui distribue les badges, y compris le
 * dédoublonnage (profil, quête).
 */

// Dérivé de LEVEL_REWARDS. Clés et valeurs sont des constantes du code
// (jamais une entrée utilisateur) : sql.raw est sûr.
export const pointsOfQuest = sql<number>`case ${quests.level}::text ${sql.raw(
	Object.entries(LEVEL_REWARDS)
		.map(([level, points]) => `when '${level}' then ${Number(points)}`)
		.join(" "),
)} else 0 end`;

/** CTE `completed` (une ligne par profil et par quête) puis `scores` (points par profil). */
export function buildScores(db: ReturnType<typeof useDb>) {
	const completed = db.$with("completed").as(
		db
			.select({
				profileId: questCompletions.profileId,
				questId: questCompletions.questId,
				completedAt: min(questCompletions.completedAt).as(
					"completed_at",
				),
			})
			.from(questCompletions)
			.groupBy(questCompletions.profileId, questCompletions.questId),
	);

	const scores = db.$with("scores").as(
		db
			.select({
				profileId: completed.profileId,
				points: sql<number>`sum(${pointsOfQuest})::int`.as("points"),
				quests: count().as("quests"),
				reachedAt: sql<Date>`max(${completed.completedAt})`.as(
					"reached_at",
				),
			})
			.from(completed)
			.innerJoin(quests, eq(quests.id, completed.questId))
			.groupBy(completed.profileId),
	);

	return { completed, scores };
}

/** Idem + CTE `ranked` : rang à égalité de points (1, 2, 2, 4). */
export function buildRanking(db: ReturnType<typeof useDb>) {
	const { completed, scores } = buildScores(db);

	const ranked = db.$with("ranked").as(
		db
			.select({
				profileId: scores.profileId,
				points: scores.points,
				quests: scores.quests,
				reachedAt: scores.reachedAt,
				rank: sql<number>`rank() over (order by ${scores.points} desc)::int`.as(
					"rank",
				),
			})
			.from(scores),
	);

	return { completed, scores, ranked };
}

/*
 * Jour de quête depuis un paramètre d'URL ("7" -> 7). 400 si ce n'est pas un
 * entier entre 1 et 25.
 */
export function requireQuestDay(value: unknown): number {
	const raw = typeof value === "string" ? value.trim() : "";

	if (!/^\d{1,2}$/.test(raw) || Number(raw) < 1 || Number(raw) > 25) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid quest day (expected 1-25)",
		});
	}

	return Number(raw);
}

/** Position d'un jour de quête par rapport à `now` : à venir, en cours, passé. */
export function questPhase(
	day: number,
	now: Date = new Date(),
): "upcoming" | "tomorrow" | "today" | "past" {
	if (now < dayUnlock(day)) return "upcoming";
	if (now < dayStart(day)) return "tomorrow";
	if (now < dayEnd(day)) return "today";

	return "past";
}

/**
 * Avancement d'un profil sur toutes les quêtes.
 *
 * `revealLocked` : false pour la personne concernée (les quêtes à venir
 * restent secrètes : ni titre ni description), true pour la modération.
 */
export async function getQuestsReport(
	event: H3Event,
	profile: Profile["id"],
	{ revealLocked }: { revealLocked: boolean },
): Promise<QuestsReport> {
	const db = useDb(event);
	const now = new Date();

	const [questRows, completions] = await Promise.all([
		db.select().from(quests).orderBy(asc(quests.id)),
		db
			.select()
			.from(questCompletions)
			.where(eq(questCompletions.profileId, profile)),
	]);

	// Si un doublon existait, on garde la validation la plus ancienne.
	const completedAt = new Map<number, Date>();

	for (const completion of completions) {
		const known = completedAt.get(completion.questId);

		if (!known || completion.completedAt < known) {
			completedAt.set(completion.questId, completion.completedAt);
		}
	}

	const data: QuestState[] = [];
	let points = 0;

	for (const quest of questRows) {
		const done = completedAt.get(quest.id) ?? null;
		const phase = questPhase(quest.id, now);

		const status: QuestStatus = done
			? "completed"
			: phase === "upcoming"
				? "locked"
				: phase === "tomorrow"
					? "tomorrow"
					: phase === "today"
						? "in_progress"
						: "missed";

		const reward = LEVEL_REWARDS[quest.level];

		if (done) points += reward;

		let progress: QuestProgress | null = null;

		if (status === "completed") {
			const target = questTarget(quest.id);

			progress = { current: target, target };
		} else if (status === "in_progress") {
			// L'affichage ne doit jamais casser sur une mesure qui échoue.
			try {
				progress = await getQuestProgress(db, quest.id, profile);
			} catch (error) {
				console.error(
					JSON.stringify({
						event: "christmas.progress.failed",
						day: quest.id,
						profile,
						error:
							error instanceof Error
								? error.message
								: String(error),
					}),
				);
			}
		}

		// Les quêtes strictement verrouillées restent anonymes pour leur
		// titulaire. À partir du révélateur de 20 h, « Demain » expose déjà
		// uniquement le contenu prévu pour le lendemain.
		const hidden = status === "locked" && !revealLocked;

		data.push({
			day: quest.id,
			level: quest.level,
			reward,
			title: hidden ? null : quest.title,
			description: hidden ? null : quest.description,
			status,
			completedAt: done,
			expiresAt: quest.expiresAt,
			progress,
		});
	}

	return {
		campaign: {
			year: CHRISTMAS_YEAR,
			today: currentQuestDay(now),
			started: now >= dayStart(1),
			ended: now >= dayEnd(25),
		},
		summary: {
			points,
			completed: completedAt.size,
			total: questRows.length,
		},
		data,
	};
}
