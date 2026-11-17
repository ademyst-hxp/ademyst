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
