export type ItemRarity = "common" | "rare" | "epic" | "collector" | "legendary" | "unclassified";

export type BadgeFamily = {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type Badge = {
	id: string;
	name: string;
	description: string | null;
	family: BadgeFamily | null;
	rarity: ItemRarity;
	color: string;
	createdAt: Date;
	updatedAt: Date;
};

export type Level = {
	id: number;
	name: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
};
