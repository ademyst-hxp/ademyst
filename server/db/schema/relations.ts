import { pgTable, uuid, timestamp, varchar } from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const follows = pgTable("follows", {
	id: uuid("id").defaultRandom().primaryKey(),

	followerId: varchar("follower_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	followingId: varchar("following_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;

export const friendships = pgTable("friendships", {
	id: uuid("id").defaultRandom().primaryKey(),

	profileAId: varchar("profile_a_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	profileBId: varchar("profile_b_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Friendship = typeof friendships.$inferSelect;

export const content_subscriptions = pgTable("content_subscriptions", {
	id: uuid("id").defaultRandom().primaryKey(),

	subscriberId: varchar("subscriber_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	subscribedToId: varchar("subscribed_to_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContentSubscription = typeof content_subscriptions.$inferSelect;

export const requests = pgTable("requests", {
	id: uuid("id").defaultRandom().primaryKey(),

	senderId: varchar("sender_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	receiverId: varchar("receiver_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Request = typeof requests.$inferSelect;

export const blocks = pgTable("blocks", {
	id: uuid("id").defaultRandom().primaryKey(),

	blockerId: varchar("blocker_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	blockedId: varchar("blocked_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Block = typeof blocks.$inferSelect;
