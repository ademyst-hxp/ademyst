import { pgTable, uuid, timestamp, text, pgEnum } from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { profile_reports, post_reports, status_reports } from "./reports";

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
		.references(() => accounts.id, { onDelete: "restrict" }),

	issuerId: uuid("issuer_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "set null" }),

	type: sanctionTypeEnum("type").notNull(),

	reason: text("reason").notNull(),
	details: text("details"),

	profileReportId: uuid("profile_report_id").references(
		() => profile_reports.id,
		{ onDelete: "set null" },
	),
	postReportId: uuid("post_report_id").references(() => post_reports.id, {
		onDelete: "set null",
	}),
	statusReportId: uuid("status_report_id").references(
		() => status_reports.id,
		{ onDelete: "set null" },
	),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at"),
});

export type Sanction = typeof sanctions.$inferSelect;
