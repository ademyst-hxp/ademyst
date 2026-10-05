import {
	pgTable,
	uuid,
	timestamp,
	text,
	integer,
	boolean,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const referralCodes = pgTable("referral_codes", {
	id: uuid("id").defaultRandom().primaryKey(),

	authorId: text("author_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	code: text("code").notNull().unique(),

	enabled: boolean("enabled").default(true).notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at"),
}).enableRLS();

export type ReferralCode = typeof referralCodes.$inferSelect;

export const referrals = pgTable("referrals", {
	id: uuid("id").defaultRandom().primaryKey(),

	referredId: text("referred_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	code: text("code")
		.notNull()
		.references(() => referralCodes.code, { onDelete: "restrict" }),

	confirmed: boolean("confirmed").default(false).notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	confirmedAt: timestamp("confirmed_at"),
}).enableRLS();

export type Referral = typeof referrals.$inferSelect;
