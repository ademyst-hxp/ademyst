import type {
	Follow as DbFollow,
	Friendship as DbFriendship,
	ContentSubscription as DbContentSubscription,
	Request as DbRequest,
	Block as DbBlock,
} from "~~/server/db/schema/relations";
import type {
	Follow,
	Friendship,
	ContentSubscription,
	Request,
	Block,
} from "~~/shared/models/relations";
import type { Profile } from "~~/shared/models/profiles";

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
