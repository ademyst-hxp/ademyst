export type ItemRarity = "common" | "rare" | "epic" | "collector" | "legendary";

export type Badge = {
	id: string;
	name: string;
	description: string | null;
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
