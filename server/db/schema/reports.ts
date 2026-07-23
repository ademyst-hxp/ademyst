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
import { posts, statuses } from "./interactions";

export const reportStatusEnum = pgEnum("report_status", [
	"pending",
	"reviewed",
	"rejected",
]);

export type ReportStatus = (typeof reportStatusEnum.enumValues)[number];

export const profile_reports = pgTable("profile_reports", {
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
});

export type ProfileReport = typeof profile_reports.$inferSelect;

export const post_reports = pgTable("post_reports", {
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
});

export type PostReport = typeof post_reports.$inferSelect;

export const status_reports = pgTable("status_reports", {
	id: uuid("id").defaultRandom().primaryKey(),

	reporterId: uuid("reporter_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "restrict" }),

	reportedStatusId: uuid("reported_status_id")
		.notNull()
		.references(() => statuses.id, { onDelete: "restrict" }),

	reason: text("reason").notNull(),
	details: text("details"),
	status: reportStatusEnum("status").notNull().default("pending"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StatusReport = typeof status_reports.$inferSelect;
