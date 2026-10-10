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
	index,
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
		updatedAt: timestamp("updated_at"),
	},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
		}).onDelete("cascade"),

		check("posts_id_hex", sql`${table.id}::text ~* '^[0-9A-F]{6,10}$'`),

		index("posts_created_at_idx").on(table.createdAt),
		index("posts_profile_id_idx").on(table.profileId),
		index("posts_parent_id_idx").on(table.parentId),
	],
).enableRLS();

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
}, (table) => [
	index("post_reactions_post_id_profile_id_idx").on(table.postId, table.profileId),
]).enableRLS();

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

	type: postsFlagEnum("type").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
	index("post_flags_post_id_idx").on(table.postId),
]).enableRLS();

export type PostFlag = typeof postsFlags.$inferSelect;

/************************************************/

export const whisperVisibilityEnum = pgEnum("whisper_visibility", [
	"outside",
	"everyone",
	"followers",
	"friends",
	"me",
]);

export const whispers = pgTable(
	"whispers",
	{
		id: varchar("id", { length: 10 }).primaryKey(),

		profileId: varchar("profile_id", { length: 10 })
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),

		content: text("content").notNull(),
		image: text("image"), // URL to the image
		color: varchar("color", { length: 7 }), // Hex code for the whisper color
		textColor: varchar("text_color", { length: 7 }), // Hex code for the text color

		visibility: whisperVisibilityEnum("visibility")
			.notNull()
			.default("everyone"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		check("whispers_id_hex", sql`${table.id}::text ~* '^[0-9A-F]{6,10}$'`),

		index("whispers_created_at_idx").on(table.createdAt),
		index("whispers_profile_id_idx").on(table.profileId),
	],
).enableRLS();

export type Whisper = typeof whispers.$inferSelect;

export const whisperReactions = pgTable("whisper_reactions", {
	id: uuid("id").defaultRandom().primaryKey(),

	whisperId: varchar("whisper_id", { length: 10 })
		.notNull()
		.references(() => whispers.id, { onDelete: "cascade" }),

	profileId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	reaction: text("reaction").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
	index("whisper_reactions_whisper_id_profile_id_idx").on(table.whisperId, table.profileId),
]).enableRLS();

export type WhisperReaction = typeof whisperReactions.$inferSelect;
