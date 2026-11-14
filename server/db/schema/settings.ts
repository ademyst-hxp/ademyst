import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { accounts } from "./accounts";

export const visibility = pgEnum("visibility", [
	"outside",
	"everyone",
	"followers",
	"friends",
	"me",
]);

export type Visibility = (typeof visibility.enumValues)[number];

export const ui_density_enum = pgEnum("ui_density", [
	"compact",
	"comfortable",
]);

export type UiDensity = (typeof ui_density_enum.enumValues)[number];

export const appearanceSettings = pgTable("appearance_settings", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	theme: text("theme").notNull().default("light"),
	highContrast: boolean("high_contrast").notNull().default(false),
	fontSize: integer("font_size").notNull().default(16),
	uiDensity: ui_density_enum("ui_density").notNull().default("comfortable"),
	alter: boolean("alter").notNull().default(false),

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

	termsOfServiceConsent: boolean("terms_of_service_consent")
		.notNull()
		.default(false),

	privacyPolicyConsent: boolean("privacy_policy_consent")
		.notNull()
		.default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	index("privacy_settings_account_id_idx").on(table.accountId),
]).enableRLS();

export type PrivacySettings = typeof privacySettings.$inferSelect;

// Un réglage par catégorie de notification (cf. NOTIFICATION_CATEGORIES dans
// shared/models/inbox.ts). Les notifications de sécurité et de modération
// n'ont pas de réglage : elles sont toujours envoyées par mail.
// Tout est désactivé par défaut : un mail n'est envoyé qu'à la demande.
export const notificationSettings = pgTable("notification_settings", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	contentEmail: boolean("content_email").notNull().default(false),
	interactionsEmail: boolean("interactions_email").notNull().default(false),
	relationsEmail: boolean("relations_email").notNull().default(false),
	rewardsEmail: boolean("rewards_email").notNull().default(false),
	accountEmail: boolean("account_email").notNull().default(false),
	announcementsEmail: boolean("announcements_email").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type NotificationSettings = typeof notificationSettings.$inferSelect;
