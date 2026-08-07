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
	"unclassified",
]);

export type ItemRarity = (typeof itemRarityEnum.enumValues)[number];


export const badges_families = pgTable("badges_families", {
	id: text("id").notNull().primaryKey(),

	name: text("name").notNull(),
	description: text("description"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type BadgeFamily = typeof badges_families.$inferSelect;

export const badges = pgTable("badges", {
	id: text("id").notNull().primaryKey(),

	name: text("name").notNull(),
	description: text("description"),

	family: text("family").references(() => badges_families.id, { onDelete: "cascade" }),
	rarity: itemRarityEnum("rarity").notNull(),

	color: varchar("color", { length: 7 }).notNull(), // Hex color code

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type Badge = typeof badges.$inferSelect;

export const levels = pgTable("levels", {
	id: integer("id").notNull().primaryKey(),

	name: text("name").notNull(),
	description: text("description"),

	color: varchar("color", { length: 7 }).notNull(), // Hex color code

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type Level = typeof levels.$inferSelect;
