import { and, eq, inArray } from "drizzle-orm";

import { useDb } from "#server/db";
import type { H3Event } from "h3";

import { blocks, follows, friendships } from "#server/db/schema/relations";
import { Profile, profiles } from "#server/db/schema/profiles";
import { privacy_settings, PrivacySettings } from "#server/db/schema/settings";

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
	// Relation from A to B (e.g. A following B, A followed by B...)

	const db = useDb(event);

	const relationships: Relationship = {
		me: false,
		following: false,
		followed: false,
		friend: false,
		friended: false,
		blocking: false,
		blocked: false,
	};

	if (!A || !B) {
		return relationships;
	}

	let issuer: Profile;

	if ((A as Identity).profileId) {
		const [author] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, (A as Identity).profileId))
			.limit(1);

		if (author) {
			issuer = author;
		} else {
			return relationships;
		}
	} else {
		issuer = A as Profile;
	}

	const target = B;

	if (!issuer || !target) {
		return relationships;
	}

	relationships.me = issuer?.accountId === target.accountId;

	const [blocked] = await db
		.select()
		.from(blocks)
		.where(
			and(
				eq(blocks.blockedId, target.id),
				eq(blocks.blockerId, issuer.id),
			),
		)
		.limit(1);

	if (blocked) {
		relationships.blocked = true;
	}

	const [blocking] = await db
		.select()
		.from(blocks)
		.where(
			and(
				eq(blocks.blockedId, issuer.id),
				eq(blocks.blockerId, target.id),
			),
		)
		.limit(1);

	if (blocking) {
		relationships.blocking = true;
	}

	if (blocking || blocked) {
		return relationships;
	}

	/* ==================================================== */

	const [following] = await db
		.select()
		.from(follows)
		.where(
			and(
				eq(follows.followerId, issuer.id),
				eq(follows.followingId, target.id),
			),
		)
		.limit(1);

	if (following) {
		relationships.following = true;
	}

	const [followed] = await db
		.select()
		.from(follows)
		.where(
			and(
				eq(follows.followerId, target.id),
				eq(follows.followingId, issuer.id),
			),
		)
		.limit(1);

	if (followed) {
		relationships.followed = true;
	}

	/* ==================================================== */

	const [friend] = await db
		.select()
		.from(friendships)
		.where(
			and(
				eq(friendships.profileBId, target.id),
				eq(friendships.profileAId, issuer.id),
			),
		)
		.limit(1);

	if (friend) {
		relationships.friend = true;
	}

	const [friended] = await db
		.select()
		.from(friendships)
		.where(
			and(
				eq(friendships.profileBId, issuer.id),
				eq(friendships.profileAId, target.id),
			),
		)
		.limit(1);

	if (friended) {
		relationships.friended = true;
	}

	/* ==================================================== */

	return relationships;
};

export const getPrivacySettings = async (
	event: H3Event,
	profile: Profile,
): Promise<PrivacySettings | null> => {
	const db = useDb(event);

	const [privacy] = await db
		.select()
		.from(privacy_settings)
		.where(eq(privacy_settings.accountId, profile.accountId))
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
	// Relation from A to B (e.g. A following B, A followed by B...)
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

	let relationships: Record<Profile["id"], Relationship> = {};

	for (let i = 0; i < B.length; i++) {
		relationships[B[i]!.id] = base;
	}

	if (!A || !B) {
		return relationships;
	}

	let issuer: Profile;

	if ((A as Identity).profileId) {
		const [author] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, (A as Identity).profileId))
			.limit(1);

		if (author) {
			issuer = author;
		} else {
			return relationships;
		}
	} else {
		issuer = A as Profile;
	}

	const targets = B;

	if (!issuer || !targets) {
		return relationships;
	}

	const blocked = (
		await db
			.select()
			.from(blocks)
			.where(
				and(
					eq(blocks.blockedId, issuer.id),
					inArray(
						blocks.blockerId,
						targets.map((t) => t.id),
					),
				),
			)
			.limit(1)
	).map((b) => b.blockerId);

	const blocking = (
		await db
			.select()
			.from(blocks)
			.where(
				and(
					eq(blocks.blockerId, issuer.id),
					inArray(
						blocks.blockedId,
						targets.map((t) => t.id),
					),
				),
			)
			.limit(1)
	).map((b) => b.blockedId);

	const following = (
		await db
			.select()
			.from(follows)
			.where(
				and(
					eq(follows.followerId, issuer.id),
					inArray(
						follows.followingId,
						targets.map((t) => t.id),
					),
				),
			)
			.limit(1)
	).map((f) => f.followingId);

	const followed = (
		await db
			.select()
			.from(follows)
			.where(
				and(
					eq(follows.followingId, issuer.id),
					inArray(
						follows.followerId,
						targets.map((t) => t.id),
					),
				),
			)
			.limit(1)
	).map((f) => f.followerId);

	const friend = (
		await db
			.select()
			.from(friendships)
			.where(
				and(
					eq(friendships.profileAId, issuer.id),
					inArray(
						friendships.profileBId,
						targets.map((t) => t.id),
					),
				),
			)
			.limit(1)
	).map((f) => f.profileBId);

	const friended = (
		await db
			.select()
			.from(friendships)
			.where(
				and(
					eq(friendships.profileBId, issuer.id),
					inArray(
						friendships.profileAId,
						targets.map((t) => t.id),
					),
				),
			)
			.limit(1)
	).map((f) => f.profileAId);

	for (const target of targets) {
		let _base = { ...base };

		_base.me = issuer?.accountId === target.accountId;

		if (blocked.includes(target.id)) _base.blocked = true;
		if (blocking.includes(target.id)) _base.blocking = true;

		if (blocking.includes(target.id) || blocked.includes(target.id)) {
			relationships[target.id] = _base;
			continue;
		}

		/* ==================================================== */

		if (following.includes(target.id)) _base.following = true;
		if (followed.includes(target.id)) _base.followed = true;

		/* ==================================================== */

		if (friend.includes(target.id)) _base.friend = true;
		if (friended.includes(target.id)) _base.friended = true;

		relationships[target.id] = _base;
	}

	/* ==================================================== */

	return relationships;
};

export const getSeveralPrivacySettings = async (
	event: H3Event,
	_profiles: Profile[],
): Promise<Record<string, PrivacySettings>> => {
	const db = useDb(event);

	const privacy = await db
		.select()
		.from(privacy_settings)
		.where(
			inArray(
				privacy_settings.accountId,
				_profiles.map((p) => p.accountId),
			),
		)
		.limit(1);

	const settings: Record<string, PrivacySettings> = {};

	for (const profile of _profiles) {
		const actual = privacy.find(
			(p) => p.accountId === profile.accountId,
		) || {
			id: crypto.randomUUID(),
			accountId: profile.accountId,
			profileVisibility: "me",
			birthdayVisibility: "me",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		settings[profile.accountId] = actual;
	}

	return settings;
};
