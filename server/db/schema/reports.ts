import {
	pgTable,
	uuid,
	timestamp,
	text,
	pgEnum,
	varchar,
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
		.references(() => accounts.id, { onDelete: "restrict" }),

	reportedProfileId: varchar("reported_profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "restrict" }),

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
		.references(() => accounts.id, { onDelete: "restrict" }),

	reportedPostId: varchar("reported_post_id", { length: 10 })
		.notNull()
		.references(() => posts.id, { onDelete: "restrict" }),

	reason: text("reason").notNull(),
	details: text("details"),
	status: reportStatusEnum("status").notNull().default("pending"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

export type PostReport = typeof postReports.$inferSelect;

export const whisperReports = pgTable("whisper_reports", {
	id: uuid("id").defaultRandom().primaryKey(),

	reporterId: uuid("reporter_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "restrict" }),

	reportedWhisperId: uuid("reported_whisper_id")
		.notNull()
		.references(() => whispers.id, { onDelete: "restrict" }),

	reason: text("reason").notNull(),
	details: text("details"),
	status: reportStatusEnum("status").notNull().default("pending"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

export type WhisperReport = typeof whisperReports.$inferSelect;
