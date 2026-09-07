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
}).enableRLS();

export type PrivacySettings = typeof privacySettings.$inferSelect;

export const notificationSettings = pgTable("notification_settings", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	securityAlertsEmail: boolean("security_alerts_email")
		.notNull()
		.default(true),
	moderationAlertsEmail: boolean("moderation_alerts_email")
		.notNull()
		.default(true),
	broadcastsEmail: boolean("broadcasts_email").notNull().default(true),
	socialEmails: boolean("social_email").notNull().default(true),
	interactionsEmails: boolean("interactions_email").notNull().default(true),
	campaignEmails: boolean("campaign_email").notNull().default(true),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type NotificationSettings = typeof notificationSettings.$inferSelect;
