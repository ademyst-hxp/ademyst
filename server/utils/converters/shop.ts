import type {
	Badge as DbBadge,
	Level as DbLevel,
} from "~~/server/db/schema/shop";
import type { Badge, Level } from "~~/shared/models/shop";

export function convertBadge(badge: DbBadge): Badge {
	return {
		id: badge.id,
		name: badge.name,
		description: badge.description ?? null,
		category: badge.category,
		rarity: badge.rarity,
		color: badge.color,
		createdAt: badge.createdAt,
	};
}

export function convertLevel(level: DbLevel): Level {
	return {
		id: level.id,
		name: level.name,
		description: level.description ?? '',
		color: level.color,
		createdAt: level.createdAt,
	};
}
