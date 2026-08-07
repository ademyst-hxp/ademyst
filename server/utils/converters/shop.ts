import { H3Event } from "h3";

import { useDb } from "~~/server/db";
import { eq, inArray } from "drizzle-orm";

import { badges_families } from "~~/server/db/schema/shop";

import type {
	BadgeFamily as DbBadgeFamily,
	Badge as DbBadge,
	Level as DbLevel,
} from "~~/server/db/schema/shop";
import type { BadgeFamily, Badge, Level } from "~~/shared/models/shop";

export async function retrieveCleanBadgeFamily(
	event: H3Event,
	family: DbBadgeFamily,
): Promise<BadgeFamily> {
	return {
		id: family.id,
		name: family.name,
		description: family.description ?? null,
		createdAt: family.createdAt,
		updatedAt: family.updatedAt,
	};
}

export async function retrieveSeveralCleanBadgeFamilies(
	event: H3Event,
	families: DbBadgeFamily[],
): Promise<BadgeFamily[]> {
	return families.map((family) => ({
		id: family.id,
		name: family.name,
		description: family.description ?? null,
		createdAt: family.createdAt,
		updatedAt: family.updatedAt,
	}));
}

export async function retrieveCleanBadge(
	event: H3Event,
	badge: DbBadge,
): Promise<Badge> {
	const [_family]: (BadgeFamily | null)[] = badge.family
		? await useDb(event)
				.select()
				.from(badges_families)
				.where(eq(badges_families.id, badge.family))
				.limit(1)
		: [null];

	const family = _family
		? await retrieveCleanBadgeFamily(event, _family)
		: null;

	return {
		id: badge.id,
		name: badge.name,
		description: badge.description ?? null,
		family: family || null,
		rarity: badge.rarity,
		color: badge.color,
		createdAt: badge.createdAt,
		updatedAt: badge.updatedAt,
	};
}

export async function retrieveSeveralCleanBadges(
	event: H3Event,
	badges: DbBadge[],
): Promise<Badge[]> {
	const _families = await useDb(event)
		.select()
		.from(badges_families)
		.where(
			inArray(
				badges_families.id,
				badges
					.map((badge) => badge.family)
					.filter(
						(familyId): familyId is string => familyId !== null,
					),
			),
		);

	const families = await retrieveSeveralCleanBadgeFamilies(event, _families);

	return badges.map((badge) => {
		const family = families.find((f) => f.id === badge.family) || null;

		return {
			id: badge.id,
			name: badge.name,
			description: badge.description ?? null,
			family: family || null,
			rarity: badge.rarity,
			color: badge.color,
			createdAt: badge.createdAt,
			updatedAt: badge.updatedAt,
		};
	});
}

export async function retrieveCleanLevel(
	event: H3Event,
	level: DbLevel,
): Promise<Level> {
	return {
		id: level.id,
		name: level.name,
		description: level.description ?? "",
		color: level.color,
		createdAt: level.createdAt,
		updatedAt: level.updatedAt,
	};
}

export async function retrieveSeveralCleanLevels(
	event: H3Event,
	levels: DbLevel[],
): Promise<Level[]> {
	return levels.map((level) => ({
		id: level.id,
		name: level.name,
		description: level.description ?? "",
		color: level.color,
		createdAt: level.createdAt,
		updatedAt: level.updatedAt,
	}));
}
