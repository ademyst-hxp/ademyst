import { and, eq, or, inArray } from "drizzle-orm";

import { useDb } from "#server/db";
import type { H3Event } from "h3";

import { blocks, follows, friendships } from "#server/db/schema/relations";
import { Profile, profiles } from "#server/db/schema/profiles";
import { privacySettings, PrivacySettings } from "#server/db/schema/settings";

import { Identity } from "../auth";

export type Relationship = {
	me: boolean; // A is B
	following: boolean; // A following B
	followed: boolean; // A followed by B
	friend: boolean; // A friend with B
	friended: boolean; // A friended by B
	blocking: boolean; // A blocking B
	blocked: boolean; // A blocked by B
};
export const getRelationshipStatus = async (
	event: H3Event,
	A?: Profile | Identity | null,
	B?: Profile | null,
): Promise<Relationship> => {
	const db = useDb(event);

	const relationship: Relationship = {
		me: false,
		following: false,
		followed: false,
		friend: false,
		friended: false,
		blocking: false,
		blocked: false,
	};

	if (!A || !B) {
		return relationship;
	}

	let issuer: Profile;

	if ((A as Identity).profileId) {
		const [profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, (A as Identity).profileId))
			.limit(1);

		if (!profile) {
			return relationship;
		}

		issuer = profile;
	} else {
		issuer = A as Profile;
	}

	const target = B;

	relationship.me = issuer.accountId === target.accountId;

	/*
	 * ============================================================
	 * Blocks
	 * ============================================================
	 *
	 * issuer -> target => blocking
	 * target -> issuer => blocked
	 *
	 * A block is terminal: no other relationship should be exposed.
	 */
	const [blockRelation] = await db
		.select({
			blockerId: blocks.blockerId,
			blockedId: blocks.blockedId,
		})
		.from(blocks)
		.where(
			or(
				and(
					eq(blocks.blockerId, issuer.id),
					eq(blocks.blockedId, target.id),
				),
				and(
					eq(blocks.blockerId, target.id),
					eq(blocks.blockedId, issuer.id),
				),
			),
		)
		.limit(1);

	if (blockRelation) {
		relationship.blocking = blockRelation.blockerId === issuer.id;
		relationship.blocked = blockRelation.blockerId === target.id;

		if (relationship.blocking || relationship.blocked) {
			return relationship;
		}
	}

	/*
	 * ============================================================
	 * Follows
	 * ============================================================
	 *
	 * issuer -> target => following
	 * target -> issuer => followed
	 */
	const followRelations = await db
		.select({
			followerId: follows.followerId,
			followingId: follows.followingId,
		})
		.from(follows)
		.where(
			or(
				and(
					eq(follows.followerId, issuer.id),
					eq(follows.followingId, target.id),
				),
				and(
					eq(follows.followerId, target.id),
					eq(follows.followingId, issuer.id),
				),
			),
		);

	for (const followRelation of followRelations) {
		if (
			followRelation.followerId === issuer.id &&
			followRelation.followingId === target.id
		) {
			relationship.following = true;
		}

		if (
			followRelation.followerId === target.id &&
			followRelation.followingId === issuer.id
		) {
			relationship.followed = true;
		}
	}

	/*
	 * ============================================================
	 * Friendships
	 * ============================================================
	 *
	 * issuer -> target => friend
	 * target -> issuer => friended
	 */
	const friendRelations = await db
		.select({
			profileAId: friendships.profileAId,
			profileBId: friendships.profileBId,
		})
		.from(friendships)
		.where(
			or(
				and(
					eq(friendships.profileAId, issuer.id),
					eq(friendships.profileBId, target.id),
				),
				and(
					eq(friendships.profileAId, target.id),
					eq(friendships.profileBId, issuer.id),
				),
			),
		);

	for (const friendRelation of friendRelations) {
		if (
			friendRelation.profileAId === issuer.id &&
			friendRelation.profileBId === target.id
		) {
			relationship.friend = true;
		}

		if (
			friendRelation.profileAId === target.id &&
			friendRelation.profileBId === issuer.id
		) {
			relationship.friended = true;
		}
	}

	return relationship;
};


export const getPrivacySettings = async (
	event: H3Event,
	profile: Profile,
): Promise<PrivacySettings | null> => {
	const db = useDb(event);

	const [privacy] = await db
		.select()
		.from(privacySettings)
		.where(eq(privacySettings.accountId, profile.accountId))
		.limit(1);

	return privacy ?? null;
};

export const canAccess = (
	privacy: any,
	relationships: Relationship,
): {
	profile: boolean;
	birthday: boolean;
} => {
	if (!privacy) {
		return {
			profile: true,
			birthday: true,
		};
	}

	if (relationships.me) {
		return {
			profile: true,
			birthday: true,
		};
	}

	if (relationships.blocked) {
		return {
			profile: false,
			birthday: false,
		};
	}

	const checkMatch = (
		value: "outside" | "everyone" | "followers" | "friends" | "me",
	) => {
		const follow = relationships.following;
		const friendship = relationships.friended;

		switch (value) {
			case "outside":
				return !follow && !friendship;
			case "everyone":
				return true;
			case "followers":
				return !!follow;
			case "friends":
				return !!friendship;
			case "me":
				return false;
			default:
				return false;
		}
	};

	return {
		profile: checkMatch(privacy.profileVisibility),
		birthday: checkMatch(privacy.birthdayVisibility),
	};
};

export const canAccessEntity = (
	privacy: any,
	relationships: Relationship,
	entityVisibility?: "outside" | "everyone" | "followers" | "friends" | "me",
): boolean => {
	if (!privacy && !entityVisibility) return false;

	if (relationships.blocked) {
		return false;
	}

	if (relationships.me) {
		return true;
	}

	const checkMatch = (
		value: "outside" | "everyone" | "followers" | "friends" | "me",
	) => {
		const follow = relationships.following;
		const friendship = relationships.friended;

		switch (value) {
			case "outside":
				return !follow && !friendship;
			case "everyone":
				return true;
			case "followers":
				return !!follow;
			case "friends":
				return !!friendship;
			case "me":
				return false;
			default:
				return false;
		}
	};

	return checkMatch(entityVisibility || privacy.profileVisibility);
};

// For multiple profiles

export const getSeveralRelationshipStatus = async (
	event: H3Event,
	A: Profile | Identity | null | undefined,
	B: Profile[],
): Promise<Record<Profile["id"], Relationship>> => {
	const db = useDb(event);

	const base: Relationship = {
		me: false,
		following: false,
		followed: false,
		friend: false,
		friended: false,
		blocking: false,
		blocked: false,
	};

	const relationships: Record<Profile["id"], Relationship> = {};

	for (const target of B) {
		relationships[target.id] = { ...base };
	}

	if (!A || B.length === 0) {
		return relationships;
	}

	let issuer: Profile;

	if ((A as Identity).profileId) {
		const [profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, (A as Identity).profileId))
			.limit(1);

		if (!profile) {
			return relationships;
		}

		issuer = profile;
	} else {
		issuer = A as Profile;
	}

	const targetIds = B.map((target) => target.id);

	const [blockRelations, followRelations, friendRelations] =
		await Promise.all([
			db
				.select({
					blockerId: blocks.blockerId,
					blockedId: blocks.blockedId,
				})
				.from(blocks)
				.where(
					or(
						and(
							eq(blocks.blockedId, issuer.id),
							inArray(blocks.blockerId, targetIds),
						),
						and(
							eq(blocks.blockerId, issuer.id),
							inArray(blocks.blockedId, targetIds),
						),
					),
				),

			db
				.select({
					followerId: follows.followerId,
					followingId: follows.followingId,
				})
				.from(follows)
				.where(
					or(
						and(
							eq(follows.followerId, issuer.id),
							inArray(follows.followingId, targetIds),
						),
						and(
							eq(follows.followingId, issuer.id),
							inArray(follows.followerId, targetIds),
						),
					),
				),

			db
				.select({
					profileAId: friendships.profileAId,
					profileBId: friendships.profileBId,
				})
				.from(friendships)
				.where(
					or(
						and(
							eq(friendships.profileAId, issuer.id),
							inArray(friendships.profileBId, targetIds),
						),
						and(
							eq(friendships.profileBId, issuer.id),
							inArray(friendships.profileAId, targetIds),
						),
					),
				),
		]);

	const blocked = new Set<Profile["id"]>();
	const blocking = new Set<Profile["id"]>();

	for (const relation of blockRelations) {
		if (relation.blockedId === issuer.id) {
			blocked.add(relation.blockerId);
		}

		if (relation.blockerId === issuer.id) {
			blocking.add(relation.blockedId);
		}
	}

	const following = new Set<Profile["id"]>();
	const followed = new Set<Profile["id"]>();

	for (const relation of followRelations) {
		if (relation.followerId === issuer.id) {
			following.add(relation.followingId);
		}

		if (relation.followingId === issuer.id) {
			followed.add(relation.followerId);
		}
	}

	const friend = new Set<Profile["id"]>();
	const friended = new Set<Profile["id"]>();

	for (const relation of friendRelations) {
		if (relation.profileAId === issuer.id) {
			friend.add(relation.profileBId);
		}

		if (relation.profileBId === issuer.id) {
			friended.add(relation.profileAId);
		}
	}

	for (const target of B) {
		const relationship: Relationship = {
			...base,
			me: issuer.accountId === target.accountId,
			blocked: blocked.has(target.id),
			blocking: blocking.has(target.id),
		};

		if (relationship.blocked || relationship.blocking) {
			relationships[target.id] = relationship;
			continue;
		}

		relationship.following = following.has(target.id);
		relationship.followed = followed.has(target.id);
		relationship.friend = friend.has(target.id);
		relationship.friended = friended.has(target.id);

		relationships[target.id] = relationship;
	}

	return relationships;
};


export const getSeveralPrivacySettings = async (
	event: H3Event,
	_profiles: Profile[],
): Promise<Record<string, PrivacySettings>> => {
	const db = useDb(event);

	const privacy = await db
		.select()
		.from(privacySettings)
		.where(
			inArray(
				privacySettings.accountId,
				_profiles.map((p) => p.accountId),
			),
		);

	const settings: Record<string, PrivacySettings> = {};

	for (const profile of _profiles) {
		const actual = privacy.find(
			(p) => p.accountId === profile.accountId,
		) || {
			id: crypto.randomUUID(),
			accountId: profile.accountId,
			profileVisibility: "me",
			birthdayVisibility: "me",
			termsOfServiceConsent: false,
			privacyPolicyConsent: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		settings[profile.accountId] = actual;
	}

	return settings;
};
