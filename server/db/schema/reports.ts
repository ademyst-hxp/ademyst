import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { posts, whispers } from "./interactions";
import { profiles } from "./profiles";

export const reportStatusEnum = pgEnum("report_status", [
	"pending",
	"reviewed",
	"rejected",
]);

export type ReportStatus = (typeof reportStatusEnum.enumValues)[number];

export const profileReports = pgTable("profile_reports", {
	id: uuid("id").defaultRandom().primaryKey(),

	reporterId: uuid("reporter_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	reportedProfileId: varchar("reported_profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "set null" }),

	reason: text("reason").notNull(),
	details: text("details"),
	status: reportStatusEnum("status").notNull().default("pending"),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	// Référence de la purge automatique (cron/, 5 ans après la dernière mise à jour)
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
}).enableRLS();

export type ProfileReport = typeof profileReports.$inferSelect;

export const postReports = pgTable("post_reports", {
	id: uuid("id").defaultRandom().primaryKey(),

	reporterId: uuid("reporter_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	reportedPostId: varchar("reported_post_id", { length: 10 })
		.notNull()
		.references(() => posts.id, { onDelete: "set null" }),

	reason: text("reason").notNull(),
	details: text("details"),
	status: reportStatusEnum("status").notNull().default("pending"),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	// Référence de la purge automatique (cron/, 5 ans après la dernière mise à jour)
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
}, (table) => [
	index("post_reports_reported_post_id_idx").on(table.reportedPostId),
]).enableRLS();

export type PostReport = typeof postReports.$inferSelect;

export const whisperReports = pgTable("whisper_reports", {
	id: uuid("id").defaultRandom().primaryKey(),

	reporterId: uuid("reporter_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	// Nullable : les whispers sont supprimés après 24 h (cron/) alors que le
	// signalement est conservé 5 ans ; la FK "set null" doit pouvoir s'appliquer.
	reportedWhisperId: varchar("reported_whisper_id", { length: 10 })
		.references(() => whispers.id, { onDelete: "set null" }),

	reason: text("reason").notNull(),
	details: text("details"),
	status: reportStatusEnum("status").notNull().default("pending"),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	// Référence de la purge automatique (cron/, 5 ans après la dernière mise à jour)
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
}).enableRLS();

export type WhisperReport = typeof whisperReports.$inferSelect;
