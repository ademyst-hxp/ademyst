import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	integer,
	boolean
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { badges, levels } from "./shop";

export const badgesEntitlements = pgTable("badges_entitlements", {
	id: uuid("id").defaultRandom().primaryKey(),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	badgeId: text("badge_id")
		.notNull()
		.references(() => badges.id, { onDelete: "cascade" }),

	name: text("name").notNull(),
	reason: text("reason").notNull(),
	revoked: boolean("revoked").notNull().default(false),
	enabled: boolean("enabled").notNull().default(true),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at"),
}).enableRLS();

export type BadgeEntitlement = typeof badgesEntitlements.$inferSelect;

export const levelsEntitlements = pgTable("levels_entitlements", {
	id: uuid("id").defaultRandom().primaryKey(),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	levelId: integer("level_id")
		.notNull()
		.references(() => levels.id, { onDelete: "cascade" }),

	name: text("name").notNull(),
	reason: text("reason").notNull(),
	revoked: boolean("revoked").notNull().default(false),
	enabled: boolean("enabled").notNull().default(true),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at"),
}).enableRLS();

export type LevelEntitlement = typeof levelsEntitlements.$inferSelect;
