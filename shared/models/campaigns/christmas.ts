import type { Profile } from "~~/shared/models/profiles";

export type QuestLevel = "secondary" | "normal" | "super" | "ultra" | "final";

export const LEVEL_REWARDS = {
	secondary: 2,
	normal: 5,
	super: 8,
	ultra: 12,
	final: 15,
} as const satisfies Record<QuestLevel, number>;

export type LevelReward<T extends QuestLevel> = (typeof LEVEL_REWARDS)[T];

export type Quest = {
	id: number;
	level: QuestLevel;
	title: string;
	description: string;
	reward: LevelReward<QuestLevel>;
	createdAt: Date;
	updatedAt: Date;
};

export type QuestCompletion = {
	profile: Profile;
	quest: Quest;
	progress: number;
	startedAt: Date;
	completedAt: Date;
};

export type LeaderboardEntry = {
	/** Rang à égalité de points : deux profils à 40 pts sont tous les deux 3e. */
	rank: number;
	points: number;
	completedQuests: number;
	profile: Profile;
};

export type LeaderboardPosition = Omit<LeaderboardEntry, "profile">;

export type LeaderboardResponse = {
	status: "ok";
	/** Nombre total de participants (au moins une quête validée). */
	total: number;
	data: LeaderboardEntry[];
	/** Position de la personne qui fait la requête ; null si non connectée ou ne participe pas. */
	me: LeaderboardPosition | null;
	next: number;
	hasNext: boolean;
};

/*
 * Quêtes : avancement de la personne connectée
 */

export type QuestStatus =
	| "locked" // jour pas encore arrivé
	| "tomorrow" // révélée la veille à 20 h UTC
	| "in_progress" // c'est le jour de la quête, pas encore validée
	| "completed"
	| "missed"; // jour passé sans validation

export type QuestProgress = {
	current: number;
	target: number;
};

export type QuestState = {
	day: number;
	level: QuestLevel;
	reward: number;
	/** null tant que la quête est verrouillée (sauf vue modération). */
	title: string | null;
	description: string | null;
	status: QuestStatus;
	completedAt: Date | null;
	expiresAt: Date | null;
	/** Renseigné pour la quête du jour et les quêtes validées, sinon null. */
	progress: QuestProgress | null;
};

export type QuestsReport = {
	campaign: {
		year: number;
		/** Jour de quête en cours (1-25), null hors campagne. */
		today: number | null;
		started: boolean;
		ended: boolean;
	};
	summary: {
		points: number;
		completed: number;
		total: number;
	};
	data: QuestState[];
};

export type QuestsResponse = { status: "ok" } & QuestsReport;

/*
 * Modération
 */

export type ModerationQuestsResponse = QuestsResponse & { profile: Profile };

export type ModerationCompletion = {
	id: string;
	day: number;
	level: QuestLevel;
	title: string;
	reward: number;
	completedAt: Date;
	profile: Profile;
};

export type ModerationCompletionsResponse = {
	status: "ok";
	data: ModerationCompletion[];
	next: number;
	hasNext: boolean;
};

export type ModerationStatsResponse = {
	status: "ok";
	campaign: { year: number; today: number | null };
	participants: number;
	totalCompletions: number;
	points: { max: number; average: number };
	/** Combien de profils obtiendraient chaque badge si la distribution avait lieu maintenant. */
	rewards: {
		badgeId: string;
		minPoints: number;
		years: number | null;
		eligible: number;
	}[];
	days: {
		day: number;
		level: QuestLevel;
		title: string;
		completions: number;
	}[];
};
