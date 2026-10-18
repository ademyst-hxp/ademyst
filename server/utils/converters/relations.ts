import type { Block as DbBlock } from "~~/server/db/schema/relations";
import type { ContentSubscription as DbContentSubscription } from "~~/server/db/schema/relations";
import type { Follow as DbFollow } from "~~/server/db/schema/relations";
import type { Friendship as DbFriendship } from "~~/server/db/schema/relations";
import type { Request as DbRequest } from "~~/server/db/schema/relations";

import type { Profile } from "~~/shared/models/profiles";
import type { Block } from "~~/shared/models/relations";
import type { ContentSubscription } from "~~/shared/models/relations";
import type { Follow } from "~~/shared/models/relations";
import type { Friendship } from "~~/shared/models/relations";
import type { Request } from "~~/shared/models/relations";


export function convertFollow(
	follow: DbFollow,
	follower: Profile,
	following: Profile,
): Follow {
	return {
		id: follow.id,
		follower,
		following,
		createdAt: follow.createdAt,
	};
}

export function convertFriendship(
	friendship: DbFriendship,
	profileA: Profile,
	profileB: Profile,
): Friendship {
	return {
		id: friendship.id,
		profileA,
		profileB,
		createdAt: friendship.createdAt,
	};
}

export function convertContentSubscription(
	subscription: DbContentSubscription,
	subscriber: Profile,
	subscribedTo: Profile,
): ContentSubscription {
	return {
		id: subscription.id,
		subscriber,
		subscribedTo,
		createdAt: subscription.createdAt,
	};
}

export function convertRequest(
	request: DbRequest,
	sender: Profile,
	receiver: Profile,
): Request {
	return {
		id: request.id,
		sender,
		receiver,
		createdAt: request.createdAt,
	};
}

export function convertBlock(
	block: DbBlock,
	blocker: Profile,
	blocked: Profile,
): Block {
	return {
		id: block.id,
		blocker,
		blocked,
		createdAt: block.createdAt,
	};
}
