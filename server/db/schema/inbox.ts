import { sql } from "drizzle-orm";
import {
	check,
	pgTable,
	text,
	timestamp,
	pgEnum,
	foreignKey,
	varchar,
	boolean,
	uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { posts, whispers } from "./interactions";

export const notification_type = pgEnum("notification_type", [
	"follow",
	"follow_request_accepted",
	"new_post",
	"mention",
	"reply",
	"reaction",
	"whisper_update",
	"whisper_mention",
	"whisper_reaction",
]);

export const notifications = pgTable("notifications", {
	id: uuid("id").defaultRandom().primaryKey(),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	issuerId: varchar("issuer_id", { length: 10 }).references(
		() => profiles.id,
		{
			onDelete: "cascade",
		},
	),

	postId: varchar("post_id", { length: 10 }).references(() => posts.id, {
		onDelete: "cascade",
	}),

	whisperId: varchar("whisper_id", { length: 10 }).references(() => whispers.id, {
		onDelete: "cascade",
	}),

	type: notification_type("type").notNull(),
	read: boolean("read").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

export type Notification = typeof notifications.$inferSelect;

export const alert_type = pgEnum("alert_type", [
	"account_suspension",
	"shadow_ban",
	"content_removal",
	"report_resolution",
	"sanction",
	"other",
]);

export const alerts = pgTable(
	"alerts",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		profileId: varchar("profile_id", { length: 10 })
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),

		type: alert_type("type").notNull(),
		reason: text("reason").notNull(),
		details: text("details").notNull(),

		read: boolean("read").notNull().default(false),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
		}).onDelete("cascade"),
	],
).enableRLS();

export type Alert = typeof alerts.$inferSelect;
