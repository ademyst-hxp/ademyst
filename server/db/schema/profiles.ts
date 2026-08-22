import { sql } from "drizzle-orm";
import {
	check,
	pgTable,
	text,
	timestamp,
	varchar,
	date,
	uuid,
	integer,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { badges, levels } from "./shop";

export const profiles = pgTable(
	"profiles",
	{
		id: varchar("id", { length: 10 }).primaryKey(),

		accountId: uuid("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),

		name: varchar("name", { length: 16 }).notNull().unique(),
		displayName: varchar("display_name", { length: 32 }),

		birthday: date("birthday"),
		bio: text("bio"),
		pronouns: varchar("pronouns", { length: 16 }),

		location: varchar("location", { length: 128 }),
		corporation: varchar("corporation", { length: 64 }),

		badge: text("badge").references(() => badges.id, {
			onDelete: "set null",
		}),

		level: integer("level")
			.notNull()
			.references(() => levels.id),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		check("profiles_id_hex", sql`${table.id}::text ~* '^[0-9A-F]{6,10}$'`),
	],
).enableRLS();

export type Profile = typeof profiles.$inferSelect;

export const profileLinks = pgTable("profile_links", {
	id: uuid("id").defaultRandom().primaryKey(),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	name: varchar("name", { length: 32 }).notNull(),
	type: text("type").notNull(),

	url: text("url"), // utilisé si il s'agit d'un lien direct vers un site web (ex: https://www.example.com)
	resourceId: text("resource_id"), // utilisé si il s'agit d'un compte identifiable par ID (ex: Discord, Twitter, etc.)
	resourceName: text("resource_name"), // utilisé si il s'agit d'un compte identifiable par nom (ex: Instagram, TikTok, Beam etc.)

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type ProfileLink = typeof profileLinks.$inferSelect;
