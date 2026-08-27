import type { H3Event } from "h3";
import { useDb } from "~~/server/db";
import { eq, inArray } from "drizzle-orm";

import type {
	BadgeEntitlement as DbBadgeEntitlement,
	LevelEntitlement as DbLevelEntitlement,
} from "~~/server/db/schema/entitlements";

import type {
	Badge as DbBadge,
	Level as DbLevel,
} from "~~/server/db/schema/shop";

import { levels, badges } from "~~/server/db/schema/shop";

import type { Badge, Level } from "~~/shared/models/shop";

import type {
	BadgeEntitlement,
	LevelEntitlement,
} from "~~/shared/models/entitlements";

import {
	retrieveCleanBadge,
	retrieveCleanLevel,
	retrieveSeveralCleanBadges,
	retrieveSeveralCleanLevels,
} from "./shop";

export async function retrieveCleanBadgeEntitlement(
	event: H3Event,
	entitlement: DbBadgeEntitlement,
): Promise<BadgeEntitlement> {
	const db = useDb(event);

	const [badge] = await db
		.select()
		.from(badges)
		.where(eq(badges.id, entitlement.badgeId))
		.limit(1);

	if (!badge) {
		throw createError({
			statusCode: 500,
			statusMessage: "Badge not found",
		});
	}

	return {
		id: entitlement.id,
		badge: await retrieveCleanBadge(event, badge),
		name: entitlement.name,
		reason: entitlement.reason,
		revoked: entitlement.revoked,
		enabled: entitlement.enabled,
		createdAt: entitlement.createdAt,
		expiresAt: entitlement.expiresAt ?? null,
	};
}

export async function retrieveSeveralCleanBadgeEntitlements(
	event: H3Event,
	entitlements: DbBadgeEntitlement[],
): Promise<BadgeEntitlement[]> {
	const db = useDb(event);

	const badgeIds = entitlements.map((entitlement) => entitlement.badgeId);

	const badgesList = await db
		.select()
		.from(badges)
		.where(inArray(badges.id, badgeIds));

	const cleanBadges = await retrieveSeveralCleanBadges(event, badgesList);

	const badgesMap = new Map<string, Badge>();

	for (const badge of badgesList) {
		badgesMap.set(
			badge.id,
			cleanBadges.find((b) => b.id === badge.id) as Badge,
		);
	}

	const result: BadgeEntitlement[] = [];

	for (const entitlement of entitlements) {
		const badge = badgesMap.get(entitlement.badgeId);

		if (!badge) {
			throw createError({
				statusCode: 500,
				statusMessage: "Badge not found",
			});
		}

		result.push({
			id: entitlement.id,
			badge,
			name: entitlement.name,
			reason: entitlement.reason,
			revoked: entitlement.revoked,
			enabled: entitlement.enabled,
			createdAt: entitlement.createdAt,
			expiresAt: entitlement.expiresAt ?? null,
		});
	}

	return result;
}

export async function retrieveCleanLevelEntitlement(
	event: H3Event,
	entitlement: DbLevelEntitlement,
): Promise<LevelEntitlement> {
	const db = useDb(event);

	const [level] = await db
		.select()
		.from(levels)
		.where(eq(levels.id, entitlement.levelId))
		.limit(1);

	if (!level) {
		throw createError({
			statusCode: 500,
			statusMessage: "Level not found",
		});
	}

	return {
		id: entitlement.id,
		level: await retrieveCleanLevel(event, level),
		name: entitlement.name,
		reason: entitlement.reason,
		revoked: entitlement.revoked,
		enabled: entitlement.enabled,
		createdAt: entitlement.createdAt,
		expiresAt: entitlement.expiresAt ?? null,
	};
}

export async function retrieveSeveralCleanLevelEntitlements(
	event: H3Event,
	entitlements: DbLevelEntitlement[],
): Promise<LevelEntitlement[]> {
	const db = useDb(event);

	const levelIds = entitlements.map((entitlement) => entitlement.levelId);

	const levelsList = await db
		.select()
		.from(levels)
		.where(inArray(levels.id, levelIds));

	const cleanLevels = await retrieveSeveralCleanLevels(event, levelsList);

	const levelsMap = new Map<string, Level>();

	for (const level of levelsList) {
		levelsMap.set(
			level.id.toString(),
			cleanLevels.find((l) => l.id === level.id) as Level,
		);
	}

	const result: LevelEntitlement[] = [];

	for (const entitlement of entitlements) {
		const level = levelsMap.get(entitlement.levelId.toString());

		if (!level) {
			throw createError({
				statusCode: 500,
				statusMessage: "Level not found",
			});
		}

		result.push({
			id: entitlement.id,
			level,
			name: entitlement.name,
			reason: entitlement.reason,
			revoked: entitlement.revoked,
			enabled: entitlement.enabled,
			createdAt: entitlement.createdAt,
			expiresAt: entitlement.expiresAt ?? null,
		});
	}

	return result;
}
