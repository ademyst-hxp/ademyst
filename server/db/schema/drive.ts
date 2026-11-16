import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { posts, whispers } from "./interactions";
import { profiles } from "./profiles";

export const attachmentVisibilityEnum = pgEnum("attachment_visibility", [
	"outside",
	"everyone",
	"followers",
	"friends",
	"me",
]);

export const attachmentTypeEnum = pgEnum("attachment_type", [
	"image",
	"video",
	"gif",
	"audio",
	"link",
	"other",
]);

export const attachmentRatioEnum = pgEnum("attachment_ratio", [
	"16:9",
	"5:4",
	"4:3",
	"3:2",
	"1:1",
	"2:3",
	"3:4",
	"4:5",
	"9:16",
]);

export const attachments = pgTable("attachments", {
	id: uuid("id").defaultRandom().primaryKey(),

	authorId: varchar("profile_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	postId: varchar("post_id", { length: 10 }).references(() => posts.id, {
		onDelete: "cascade",
	}),

	type: attachmentTypeEnum("type").notNull().default("link"),

	ratio: attachmentRatioEnum("ratio").notNull().default("1:1"),

	title: text("title"),
	altText: text("alt_text"),

	// Clé du fichier dans le bucket "files" (hébergé) ou URL (GIF, lien externe)
	link: text("link").notNull(),

	// Id du registre (shared/consts/links.ts), uniquement pour les liens reconnus
	// (type "link"). Null pour tous les autres Attachments et les liens hors registre.
	linkType: text("link_type"),

	visibility: attachmentVisibilityEnum("visibility")
		.notNull()
		.default("everyone"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
	// Remplace attachments_post_id_idx (même colonne de tête) : permet de
	// compter les liens / images d'une publication directement dans l'index.
	index("attachments_post_id_type_idx").on(table.postId, table.type),
]).enableRLS();

export type Attachment = typeof attachments.$inferSelect;
