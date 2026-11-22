import {
	type QuestLevel,
	type LevelReward,
	LEVEL_REWARDS,
} from "~~/shared/models/campaigns/christmas";

export function getXPFromLevel<T extends QuestLevel>(level: T): LevelReward<T> {
	return LEVEL_REWARDS[level] as LevelReward<T>;
}

/** Année de l'édition en cours. */
export const CHRISTMAS_YEAR = 2026;

/** Nombre de jours (donc de quêtes) de la campagne. */
export const CHRISTMAS_TOTAL_DAYS = 25;

/**
 * Début de la campagne : 1er décembre, 00:00 UTC.
 * Tout le reste de la campagne raisonne en jours UTC (cron de distribution,
 * filtres de modération, CampaignBanner) : le compte à rebours fait de même.
 */
export function getChristmasStart(year: number = CHRISTMAS_YEAR): number {
	return Date.UTC(year, 11, 1);
}

/** Fin de la campagne : fin du 25 décembre, soit le 26 décembre à 00:00 UTC. */
export function getChristmasEnd(year: number = CHRISTMAS_YEAR): number {
	return Date.UTC(year, 11, CHRISTMAS_TOTAL_DAYS + 1);
}

export type ChristmasPhase = "upcoming" | "running" | "ended";

export function getChristmasPhase(
	now: number,
	year: number = CHRISTMAS_YEAR,
): ChristmasPhase {
	if (now < getChristmasStart(year)) return "upcoming";
	if (now >= getChristmasEnd(year)) return "ended";

	return "running";
}
