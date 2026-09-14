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
import { sanctions } from "./sanctions";
import { profileReports, postReports, whisperReports } from "./reports";

/*
 * INTERACTIONS (posts, whispers)
 */

export const itxNotificationType = pgEnum("notification_itx_type", [
	"suggestion", // Nouvelle publication/whisper/etc pouvant intéresser l'utilisateur
	"mention", // Mention
	"reply", // Réponse
	"reaction", // Réaction
	"sanction", // Sanction
]);

// Notifications liées aux posts (nouvelle publication, mention, réponse, réaction, sanction)
export const postNotifications = pgTable("notification_post", {
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

	type: itxNotificationType("type").notNull(),
	read: boolean("read").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(), // Juste à des fins de modération
	updatedAt: timestamp("updated_at").defaultNow().notNull(), // Date réellement effective côté client
}).enableRLS();

export type PostNotification = typeof postNotifications.$inferSelect;

// Notifications liées aux whispers (nouveau whisper, mention, sanction)
export const whisperNotifications = pgTable("notification_whisper", {
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

	whisperId: varchar("whisper_id", { length: 10 }).references(
		() => whispers.id,
		{
			onDelete: "cascade",
		},
	),

	type: itxNotificationType("type").notNull(),
	read: boolean("read").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(), // Juste à des fins de modération
	updatedAt: timestamp("updated_at").defaultNow().notNull(), // Date réellement effective côté client
}).enableRLS();

export type WhisperNotification = typeof whisperNotifications.$inferSelect;

/*
 * RELATIONS (follows/requests, etc.)
 */

export const relNotificationType = pgEnum("notification_rel_type", [
	"request", // Demande (abonnement, etc.) de B à A
	"request_accepted", // Demande de A acceptée par B
	"happened", // B s'abonne à A sans demande préalable
]);

// Abonnements, demandes d'abonnement, etc.
export const followNotifications = pgTable("notification_follow", {
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

	type: relNotificationType("type").notNull(),
	read: boolean("read").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(), // Juste à des fins de modération
	updatedAt: timestamp("updated_at").defaultNow().notNull(), // Date réellement effective côté client
}).enableRLS();

export type FollowNotification = typeof followNotifications.$inferSelect;

/*
 * SANCTIONS (account suspension, shadow ban, content removal/flag, etc.)
 */

export const sanctionNotificationType = pgEnum("notification_sanction_type", [
	"account_suspension", // Suspension de compte
	"mute", // Mute
	"shadow_ban", // Shadow ban
	"warn", // Sanction (warning, etc.)
]);

export type SanctionNotificationType =
	keyof typeof sanctionNotificationType.enumValues;

export const postSanctionNotificationType = pgEnum(
	"notification_post_sanction_type",
	[
		"removal", // Contenu supprimé
		"flag", // Contenu flagged
	],
);

export type PostSanctionNotificationType =
	keyof typeof postSanctionNotificationType.enumValues;

// Sanctions liées à un compte (suspension, shadow ban, etc.)
export const accountSanctionNotifications = pgTable("notification_sanction", {
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

	sanctionId: uuid("sanction_id")
		.notNull()
		.references(() => sanctions.id, { onDelete: "cascade" }),

	type: sanctionNotificationType("type").notNull(),
	reason: text("reason").notNull(),
	details: text("details").notNull(),

	read: boolean("read").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(), // Juste à des fins de modération
	updatedAt: timestamp("updated_at").defaultNow().notNull(), // Date réellement effective côté client
}).enableRLS();

export type SanctionNotification =
	typeof accountSanctionNotifications.$inferSelect;

// Sanctions liées à un post (contenu supprimé, contenu flagged, etc.)
export const postSanctionNotifications = pgTable("notification_post_sanction", {
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

	postId: varchar("post_id", { length: 10 })
		.notNull()
		.references(() => posts.id, { onDelete: "cascade" }),

	sanctionId: uuid("sanction_id")
		.notNull()
		.references(() => sanctions.id, {
			onDelete: "cascade",
		}),

	type: postSanctionNotificationType("type").notNull(),
	reason: text("reason").notNull(),
	details: text("details").notNull(),

	read: boolean("read").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(), // Juste à des fins de modération
	updatedAt: timestamp("updated_at").defaultNow().notNull(), // Date réellement effective côté client
}).enableRLS();

export type PostSanctionNotification =
	typeof postSanctionNotifications.$inferSelect;

/*
 * REPORTS (read receipts, updates, etc.)
 */

export const reportNotificationType = pgEnum("notification_report_type", [
	"update", // Rapport mis à jour par un modérateur
	"read", // Rapport lu par un modérateur
]);

// Notifications liées à un rapport (rapport mis à jour, lu, etc.)
export const reportNotifications = pgTable("notification_report", {
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

	profileReportId: uuid("profile_report_id").references(
		() => profileReports.id,
		{ onDelete: "cascade" },
	),

	postReportId: uuid("post_report_id").references(() => postReports.id, {
		onDelete: "cascade",
	}),

	whisperReportId: uuid("whisper_report_id").references(
		() => whisperReports.id,
		{ onDelete: "cascade" },
	),

	type: reportNotificationType("type").notNull(),
	read: boolean("read").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(), // Juste à des fins de modération
	updatedAt: timestamp("updated_at").defaultNow().notNull(), // Date réellement effective côté client
}).enableRLS();

export type ReportNotification = typeof reportNotifications.$inferSelect;
