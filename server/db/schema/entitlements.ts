import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	integer,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { badges, levels } from "./shop";

export const badges_entitlements = pgTable("badges_entitlements", {
	id: uuid("id").defaultRandom().primaryKey(),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	badgeId: text("badge_id")
		.notNull()
		.references(() => badges.id, { onDelete: "cascade" }),

	name: text("name").notNull(),
	reason: text("reason").notNull(),
	revoked: text("revoked").notNull().default("false"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at"),
});

export type BadgeEntitlement = typeof badges_entitlements.$inferSelect;

export const levels_entitlements = pgTable("levels_entitlements", {
	id: uuid("id").defaultRandom().primaryKey(),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	levelId: integer("level_id")
		.notNull()
		.references(() => levels.id, { onDelete: "cascade" }),

	name: text("name").notNull(),
	reason: text("reason").notNull(),
	revoked: text("revoked").notNull().default("false"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at"),
});

export type LevelEntitlement = typeof levels_entitlements.$inferSelect;
