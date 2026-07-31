export type ItemRarity = "common" | "rare" | "epic" | "collector" | "legendary" | "unclassified";
export type BadgeCategory = "achievement" | "title" | "level";

export type Badge = {
	id: string;
	name: string;
	description: string | null;
	category: BadgeCategory;
	rarity: ItemRarity;
	color: string;
	createdAt: Date;
};

export type Level = {
	id: number;
	name: string;
	description: string;
	color: string;
	createdAt: Date;
};
