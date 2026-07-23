import {
	pgTable,
	text,
	timestamp,
	pgEnum,
	varchar,
	integer,
} from "drizzle-orm/pg-core";

export const itemRarityEnum = pgEnum("item_rarity", [
	"common",
	"rare",
	"epic",
	"collector",
	"legendary",
]);

export type ItemRarity = (typeof itemRarityEnum.enumValues)[number];

export const badges = pgTable("badges", {
	id: text("id").notNull().primaryKey(),

	name: text("name").notNull(),
	description: text("description"),
	rarity: itemRarityEnum("rarity").notNull(),

	color: varchar("color", { length: 7 }).notNull(), // Hex color code

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;

export const levels = pgTable("levels", {
	id: integer("id").notNull().primaryKey(),

	name: text("name").notNull(),
	description: text("description"),

	color: varchar("color", { length: 7 }).notNull(), // Hex color code

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Level = typeof levels.$inferSelect;
