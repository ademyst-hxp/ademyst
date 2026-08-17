import type {
	BadgeEntitlement as DbBadgeEntitlement,
	LevelEntitlement as DbLevelEntitlement,
} from "~~/server/db/schema/entitlements";
import type {
	BadgeEntitlement,
	LevelEntitlement,
} from "~~/shared/models/entitlements";
import type { Badge, Level } from "~~/shared/models/shop";

export function convertBadgeEntitlement(
	entitlement: DbBadgeEntitlement,
	badge: Badge,
): BadgeEntitlement {
	return {
		id: entitlement.id,
		badge,
		name: entitlement.name,
		reason: entitlement.reason,
		revoked: entitlement.revoked,
		enabled: entitlement.enabled,
		createdAt: entitlement.createdAt,
		expiresAt: entitlement.expiresAt ?? null,
	};
}

export function convertLevelEntitlement(
	entitlement: DbLevelEntitlement,
	level: Level,
): LevelEntitlement {
	return {
		id: entitlement.id,
		level,
		name: entitlement.name,
		reason: entitlement.reason,
		revoked: entitlement.revoked,
		enabled: entitlement.enabled,
		createdAt: entitlement.createdAt,
		expiresAt: entitlement.expiresAt ?? null,
	};
}
