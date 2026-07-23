import {
	pgTable,
	uuid,
	timestamp,
	text,
	pgEnum
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";

export const sanctionTypeEnum = pgEnum("sanction_type", [
	"ban", // niveau 0
	"mute", // niveau 1
	"shadow_ban", // niveau 2
]);

export type SanctionType = typeof sanctionTypeEnum.enumValues[number];

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

	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at"),
});

export type Sanction = typeof sanctions.$inferSelect;
