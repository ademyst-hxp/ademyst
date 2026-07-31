import {
	pgTable,
	uuid,
	timestamp,
	text,
	pgEnum,
	boolean,
	integer,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";

export const visibility = pgEnum("visibility", [
	"outside",
	"everyone",
	"followers",
	"friends",
	"me",
]);

export type Visibility = typeof visibility.enumValues[number];

export const ui_density_enum = pgEnum("ui_density", ["compact", "comfortable", "auto"]);

export type UiDensity = typeof ui_density_enum.enumValues[number];

export const appearanceSettings = pgTable("appearance_settings", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	theme: text("theme").notNull().default("light"),
	highContrast: boolean("high_contrast").notNull().default(false),
	dyslexiaFriendly: boolean("dyslexia_friendly").notNull().default(false),
	fontSize: integer("font_size").notNull().default(16),
	uiDensity: ui_density_enum("ui_density").notNull().default("auto"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type AppearanceSettings = typeof appearanceSettings.$inferSelect;

export const privacySettings = pgTable("privacy_settings", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	profileVisibility: visibility("profile_visibility")
		.notNull()
		.default("everyone"),

	birthdayVisibility: visibility("birthday_visibility")
		.notNull()
		.default("friends"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type PrivacySettings = typeof privacySettings.$inferSelect;
