import type { Profile } from "./profiles";

export type Follow = {
	id: string;
	follower: Profile;
	following: Profile;
	createdAt: Date;
};

export type Friendship = {
	id: string;
	profileA: Profile;
	profileB: Profile;
	createdAt: Date;
};

export type ContentSubscription = {
	id: string;
	subscriber: Profile;
	subscribedTo: Profile;
	createdAt: Date;
};

export type Request = {
	id: string;
	sender: Profile;
	receiver: Profile;
	createdAt: Date;
};

export type Block = {
	id: string;
	blocker: Profile;
	blocked: Profile;
	createdAt: Date;
};
