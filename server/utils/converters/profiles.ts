import type { Profile as PartialProfile } from "~~/server/db/schema/profiles";

import { eq, count, inArray } from "drizzle-orm";

import type { Profile } from "~~/shared/models/profiles";

import { db } from "#server/db";
import { profileLinks, profiles } from "#server/db/schema/profiles";
import { follows } from "#server/db/schema/relations";

import {
	getSeveralRelationshipStatus,
	getSeveralPrivacySettings,
	canAccess,
} from "~~/server/utils/helpers/privacy";

export async function retrieveCleanProfile(
	identity: Identity | null | undefined,
	profile: PartialProfile,
): Promise<Profile> {
	const relationships = await getRelationshipStatus(identity, profile);
	const privacy = await getPrivacySettings(profile);
	const access = await canAccess(privacy, relationships);

	const { blocked, friended, ...r } = relationships;

	if (!access.profile) {
		return {
			id: profile.id,
			name: profile.name,
			displayName: null,
			birthday: null,
			bio: null,
			pronouns: null,
			location: null,
			corporation: null,
			createdAt: profile.createdAt,
			badge: null,
			level: profile.level,
			links: [],
			relationships: r,
			stats: {
				followers: 0,
				following: 0,
			},
		};
	}

	const links = await db
		.select()
		.from(profileLinks)
		.where(eq(profileLinks.profileId, profile.id));

	const [followersCount] = await db
		.select({ count: count() })
		.from(follows)
		.where(eq(follows.followingId, profile.id));

	const [followingCount] = await db
		.select({ count: count() })
		.from(follows)
		.where(eq(follows.followerId, profile.id));

	const stats = {
		followers: followersCount?.count || 0,
		following: followingCount?.count || 0,
	};

	return {
		id: profile.id,
		name: profile.name,
		displayName: profile.displayName,
		birthday: access.birthday ? profile.birthday : null,
		bio: profile.bio,
		pronouns: profile.pronouns,
		location: profile.location,
		corporation: profile.corporation,
		createdAt: profile.createdAt,
		badge: profile.badge,
		level: profile.level,
		links: links.map((link) => ({
			url: link.url,
			type: link.type,
		})),
		stats: {
			followers: stats.followers,
			following: stats.following,
		},
		relationships: r,
	};
}

export async function retrieveSeveralCleanProfiles(
	identity: Identity | null | undefined,
	_profiles: PartialProfile[],
): Promise<Profile[]> {
	const relationships = await getSeveralRelationshipStatus(
		identity,
		_profiles,
	);
	const privacy = await getSeveralPrivacySettings(_profiles);

	let accesses: Record<
		Profile["id"],
		{ profile: boolean; birthday: boolean }
	> = {};

	for (const profile of _profiles) {
		const access = canAccess(
			privacy[profile.accountId!],
			relationships[profile.id]!,
		);
		accesses[profile.id] = access;
	}

	const result: Profile[] = [];

	const every_links = await db
		.select()
		.from(profileLinks)
		.where(
			inArray(
				profileLinks.profileId,
				_profiles.map((p) => p.id),
			),
		);

	const followersCounts = await db
		.select({ followingId: follows.followingId, count: count() })
		.from(follows)
		.where(
			inArray(
				follows.followingId,
				_profiles.map((p) => p.id),
			),
		)
		.groupBy(follows.followingId);

	const followingCounts = await db
		.select({ followerId: follows.followerId, count: count() })
		.from(follows)
		.where(
			inArray(
				follows.followerId,
				_profiles.map((p) => p.id),
			),
		)
		.groupBy(follows.followerId);

	for (const profile of _profiles) {
		const relationship = relationships[profile.accountId!]!;
		const access = accesses[profile.id]!;
		const links = every_links.filter(
			(link) => link.profileId === profile.id,
		);

		const r = relationship;

		if (!access.profile) {
			result.push({
				id: profile.id,
				name: profile.name,
				displayName: null,
				birthday: null,
				bio: null,
				pronouns: null,
				location: null,
				corporation: null,
				createdAt: profile.createdAt,
				badge: null,
				level: profile.level,
				links: [],
				relationships: r,
				stats: {
					followers: 0,
					following: 0,
				},
			});
			continue;
		}

		const stats = {
			followers:
				followersCounts.find((c) => c.followingId === profile.id)
					?.count || 0,
			following:
				followingCounts.find((c) => c.followerId === profile.id)
					?.count || 0,
		};

		result.push({
			id: profile.id,
			name: profile.name,
			displayName: profile.displayName,
			birthday: access.birthday ? profile.birthday : null,
			bio: profile.bio,
			pronouns: profile.pronouns,
			location: profile.location,
			corporation: profile.corporation,
			createdAt: profile.createdAt,
			badge: profile.badge,
			level: profile.level,
			links: links.map((link) => ({
				url: link.url,
				type: link.type,
			})),
			stats: {
				followers: stats.followers,
				following: stats.following,
			},
			relationships: r,
		});
	}

	return result;
}
