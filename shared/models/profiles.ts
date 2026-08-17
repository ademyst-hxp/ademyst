import type { Badge } from "./shop";

export type Relationship = {
	me: boolean; // A is B
	following: boolean; // A following B
	followed: boolean; // A followed by B
	friend: boolean; // A friend with B
	blocking: boolean; // A blocking B
};

export type Profile = {
	id: string;
	name: string;
	displayName: string | null;
	birthday: string | null;
	bio: string | null;
	pronouns: string | null;
	location: string | null;
	corporation: string | null;
	createdAt: Date;
	badge: Badge | null;
	badges: Badge[];
	level: number | null;
	links: ProfileLink[];
	relationships: Relationship;
	stats: {
		followers: number;
		following: number;
	};
};

export type ProfileLink = {
	url: string;
	type: string;
};
