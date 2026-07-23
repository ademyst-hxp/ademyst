import { sql } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	pgEnum,
	foreignKey,
	check,
	varchar,
	uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const postVisibilityEnum = pgEnum("post_visibility", [
	"outside",
	"everyone",
	"followers",
	"friends",
	"me",
]);

export const posts = pgTable(
	"posts",
	{
		id: varchar("id", { length: 10 }).primaryKey(),

		profileId: varchar("profile_id", { length: 10 })
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),

		parentId: varchar("parent_id", { length: 10 }),
		content: text("content").notNull(),

		visibility: postVisibilityEnum("visibility")
			.notNull()
			.default("everyone"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
		}).onDelete("cascade"),

		check("posts_id_hex", sql`${table.id}::text ~* '^[0-9A-F]{6,10}$'`),
	],
);

export type Post = typeof posts.$inferSelect;

export const postsReactionsEnum = pgEnum("post_reaction", ["like"]);

export const postReactions = pgTable("post_reactions", {
	id: uuid("id").defaultRandom().primaryKey(),

	postId: varchar("post_id", { length: 10 })
		.notNull()
		.references(() => posts.id, { onDelete: "cascade" }),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	reaction: postsReactionsEnum("reaction").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PostReaction = typeof postReactions.$inferSelect;

export const postsFlagEnum = pgEnum("post_flag", [
	"NFE", // Contenu non-adapté à un public mineur (nudité non-artistique, violence...)
	"AI", // Contenu partiellement ou complètement généré par IA
	"joke", // Contenu à prendre au second degré
	"misinformation", // Contenu trompeur
	"spam", // Spam ou flood
	"suspicious", // Contenu suspect
	"suicide", // Suicide ou automutilation
]);

export const postsFlags = pgTable("post_flags", {
	id: uuid("id").defaultRandom().primaryKey(),

	postId: varchar("post_id", { length: 10 })
		.notNull()
		.references(() => posts.id, { onDelete: "cascade" }),

	flag: postsFlagEnum("flag").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PostFlag = typeof postsFlags.$inferSelect;

/************************************************/

export const statusVisibilityEnum = pgEnum("status_visibility", [
	"outside",
	"everyone",
	"followers",
	"friends",
	"me",
]);

export const statuses = pgTable("statuses", {
	id: uuid("id").defaultRandom().primaryKey(),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	content: text("content").notNull(),
	image: text("image"), // URL to the image
	color: varchar("color", { length: 7 }), // Hex code for the status color

	textColor: varchar("text_color", { length: 7 })
		.notNull()
		.default("#ffffff"), // Hex code for the text color

	visibility: statusVisibilityEnum("visibility")
		.notNull()
		.default("everyone"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Status = typeof statuses.$inferSelect;

export const statusReactions = pgTable("status_reactions", {
	id: uuid("id").defaultRandom().primaryKey(),

	statusId: uuid("status_id")
		.notNull()
		.references(() => statuses.id, { onDelete: "cascade" }),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	reaction: text("reaction").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StatusReaction = typeof statusReactions.$inferSelect;
