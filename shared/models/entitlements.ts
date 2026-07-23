import type { Badge, Level } from "./shop";

export type BadgeEntitlement = {
	id: string;
	badge: Badge;
	name: string;
	reason: string;
	revoked: string;
	createdAt: Date;
	expiresAt: Date | null;
};

export type LevelEntitlement = {
	id: string;
	level: Level;
	name: string;
	reason: string;
	revoked: string;
	createdAt: Date;
	expiresAt: Date | null;
};
