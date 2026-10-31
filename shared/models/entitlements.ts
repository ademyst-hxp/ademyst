import type { Profile } from "./profiles";
import type { Badge, Level } from "./shop";


export type BadgeEntitlement = {
	id: string;
	badge: Badge;
	profile: Profile;
	name: string;
	reason: string;
	revoked: boolean;
	enabled: boolean;
	createdAt: Date;
	expiresAt: Date | null;
};

export type LevelEntitlement = {
	id: string;
	level: Level;
	profile: Profile;
	name: string;
	reason: string;
	revoked: boolean;
	enabled: boolean;
	createdAt: Date;
	expiresAt: Date | null;
};
