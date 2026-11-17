import {
	pgTable,
	pgEnum,
	text,
	integer,
	boolean,
	timestamp,
	uuid,
	check,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

import { profiles } from "../profiles";

export const christmasQuestLevelEnum = pgEnum("christmas_quest_level", [
	"normal",
	"secondary",
	"super",
	"ultra",
	"final",
]);

export const christmasQuests = pgTable(
	"christmas_quests",
	{
		id: integer("day").primaryKey(),

		level: christmasQuestLevelEnum("level").notNull(),

		title: text("title").notNull(),
		description: text("description").notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at"),
	},
	(table) => [
		check("christmas_quests_day_check", sql`${table.id} BETWEEN 1 AND 25`),
	],
).enableRLS();

export type ChristmasQuest = typeof christmasQuests.$inferSelect;

export const christmasQuestCompletions = pgTable(
	"christmas_quest_completions",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		profileId: text("profile_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),

		questId: integer("quest_id")
			.notNull()
			.references(() => christmasQuests.id, { onDelete: "cascade" }),

		completedAt: timestamp("completed_at").defaultNow().notNull(),
	},
).enableRLS();

export type ChristmasQuestCompletion =
	typeof christmasQuestCompletions.$inferSelect;
