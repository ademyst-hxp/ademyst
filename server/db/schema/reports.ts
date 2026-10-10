import {
	pgTable,
	uuid,
	timestamp,
	text,
	pgEnum,
	varchar,
	index,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";

import { profiles } from "./profiles";
import { posts, whispers } from "./interactions";

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
}, (table) => [
	index("post_reports_reported_post_id_idx").on(table.reportedPostId),
]).enableRLS();

export type PostReport = typeof postReports.$inferSelect;

export const whisperReports = pgTable("whisper_reports", {
	id: uuid("id").defaultRandom().primaryKey(),

	reporterId: uuid("reporter_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	reportedWhisperId: varchar("reported_whisper_id", { length: 10 })
		.notNull()
		.references(() => whispers.id, { onDelete: "set null" }),

	reason: text("reason").notNull(),
	details: text("details"),
	status: reportStatusEnum("status").notNull().default("pending"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

export type WhisperReport = typeof whisperReports.$inferSelect;
