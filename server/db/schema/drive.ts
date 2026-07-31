import { sql } from "drizzle-orm";
import {
	check,
	pgTable,
	text,
	timestamp,
	pgEnum,
	foreignKey,
	varchar,
	uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { posts, whispers } from "./interactions";

export const attachmentVisibilityEnum = pgEnum("attachment_visibility", [
	"outside",
	"everyone",
	"followers",
	"friends",
	"me",
]);

export const attachments = pgTable("attachments", {
	id: uuid("id").defaultRandom().primaryKey(),

	authorId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	postId: varchar("post_id", { length: 10 }).references(() => posts.id, {
		onDelete: "cascade",
	}),

	whisperId: uuid("whisper_id").references(() => whispers.id, {
		onDelete: "cascade",
	}),

	link: text("link").notNull(),

	visibility: attachmentVisibilityEnum("visibility")
		.notNull()
		.default("everyone"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
