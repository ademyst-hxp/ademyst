import { pgTable, uuid, timestamp, varchar, index } from "drizzle-orm/pg-core";

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
}, (table) => [
	index("follows_follower_id_following_id_idx").on(table.followerId, table.followingId),
	index("follows_following_id_idx").on(table.followingId),
]).enableRLS();

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
}, (table) => [
	index("friendships_profile_a_id_profile_b_id_idx").on(table.profileAId, table.profileBId),
	index("friendships_profile_b_id_idx").on(table.profileBId),
]).enableRLS();

export type Friendship = typeof friendships.$inferSelect;

export const contentSubscriptions = pgTable("content_subscriptions", {
	id: uuid("id").defaultRandom().primaryKey(),

	subscriberId: varchar("subscriber_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	subscribedToId: varchar("subscribed_to_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

export type ContentSubscription = typeof contentSubscriptions.$inferSelect;

export const requests = pgTable("requests", {
	id: uuid("id").defaultRandom().primaryKey(),

	senderId: varchar("sender_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	receiverId: varchar("receiver_id", { length: 10 })
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),

	createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

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
}, (table) => [
	index("blocks_blocker_id_blocked_id_idx").on(table.blockerId, table.blockedId),
	index("blocks_blocked_id_idx").on(table.blockedId),
]).enableRLS();

export type Block = typeof blocks.$inferSelect;
