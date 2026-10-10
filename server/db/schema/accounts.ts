import { sql } from "drizzle-orm";
import {
	check,
	pgTable,
	text,
	timestamp,
	boolean,
	pgEnum,
	varchar,
	uuid,
	integer,
	index,
} from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
	id: uuid("id").defaultRandom().primaryKey(),

	email: text("email").notNull().unique(),

	passwordHash: text("password_hash").notNull().unique(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	confirmedAt: timestamp("confirmed_at"),
}).enableRLS();

export type Account = typeof accounts.$inferSelect;

export const sessions = pgTable("sessions", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	token: text("token").notNull().unique(),

	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	index("sessions_account_id_idx").on(table.accountId),
]).enableRLS();

export type Session = typeof sessions.$inferSelect;

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	token: text("token").notNull().unique(),

	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	usedAt: timestamp("used_at"),
	revoked: boolean("revoked").default(false).notNull(),
}).enableRLS();

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const emailConfirmationTokens = pgTable("email_confirmation_tokens", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	token: text("token").notNull().unique(),

	email: text("email").notNull(),

	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),

	usedAt: timestamp("used_at"),
	revoked: boolean("revoked").default(false).notNull(),
}).enableRLS();

export type EmailConfirmationToken =
	typeof emailConfirmationTokens.$inferSelect;

export const accountDeletionTokens = pgTable("account_deletion_tokens", {
	id: uuid("id").defaultRandom().primaryKey(),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	token: text("token").notNull().unique(),

	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	usedAt: timestamp("used_at"),
	revoked: boolean("revoked").default(false).notNull(),
}).enableRLS();

export type AccountDeletionToken = typeof accountDeletionTokens.$inferSelect;

export const accountActionEnum = pgEnum("account_action", [
	"password_change",
	"email_change",
	"email_confirmation",
	"account_deletion",
]);

export type AccountAction = (typeof accountActionEnum.enumValues)[number];

export const accountModificationHistory = pgTable(
	"account_modification_history",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		accountId: uuid("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),

		action: accountActionEnum("action").notNull(),

		userAgent: text("user_agent"),
		ipAddress: text("ip_address"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
).enableRLS();

export type AccountModificationHistory = typeof accountModificationHistory.$inferSelect
