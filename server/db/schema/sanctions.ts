import { pgTable, uuid, timestamp, text, pgEnum } from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { profileReports, postReports, whisperReports } from "./reports";

export const sanctionTypeEnum = pgEnum("sanction_type", [
	"ban", // niveau 0
	"mute", // niveau 1
	"shadow_ban", // niveau 2
	"warning",
]);

export type SanctionType = (typeof sanctionTypeEnum.enumValues)[number];

export const sanctions = pgTable("sanctions", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	issuerId: uuid("issuer_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "set null" }),

	type: sanctionTypeEnum("type").notNull(),

	reason: text("reason").notNull(),
	details: text("details"),

	profileReportId: uuid("profile_report_id").references(
		() => profileReports.id,
		{ onDelete: "set null" },
	),
	postReportId: uuid("post_report_id").references(() => postReports.id, {
		onDelete: "set null",
	}),
	whisperReportId: uuid("whisper_report_id").references(
		() => whisperReports.id,
		{ onDelete: "set null" },
	),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at"),
}).enableRLS();

export type Sanction = typeof sanctions.$inferSelect;
