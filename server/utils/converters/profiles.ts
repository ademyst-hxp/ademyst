import { and, eq, count, inArray } from "drizzle-orm";

import { createDb } from "#server/db";
import type { H3Event } from "h3";

import type { Profile as PartialProfile } from "~~/server/db/schema/profiles";
import { profileLinks } from "#server/db/schema/profiles";
import { follows } from "#server/db/schema/relations";
import { badges } from "~~/server/db/schema/shop";
import { badgesEntitlements } from "~~/server/db/schema/entitlements";

import type { Profile } from "~~/shared/models/profiles";

import {
	retrieveCleanBadge,
	retrieveSeveralCleanBadges,
} from "~~/server/utils/converters/shop";

import {
	getSeveralRelationshipStatus,
	getSeveralPrivacySettings,
	canAccess,
} from "~~/server/utils/helpers/privacy";

export async function retrieveCleanProfile(
	event: H3Event,
	identity: Identity | null | undefined,
	profile: PartialProfile,
): Promise<Profile> {
	const { db, client } = createDb();

	try {
		const relationships = await getRelationshipStatus(
			event,
			identity,
			profile,
		);
		const privacy = await getPrivacySettings(event, profile);
		const access = canAccess(privacy, relationships);

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
				badges: [],
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

		const profileBadges = (
			await db
				.select()
				.from(badgesEntitlements)
				.where(
					and(
						eq(badgesEntitlements.profileId, profile.id),
						eq(badgesEntitlements.enabled, true),
					),
				)
				.innerJoin(badges, eq(badges.id, badgesEntitlements.badgeId))
		)
			.filter(
				(badge): badge is NonNullable<typeof badge> => badge !== null,
			)
			.filter((b) => b.badges_entitlements?.enabled === true);

		const [followersCount] = await db
			.select({ count: count() })
			.from(follows)
			.where(eq(follows.followingId, profile.id));

		const [followingCount] = await db
			.select({ count: count() })
			.from(follows)
			.where(eq(follows.followerId, profile.id));

		const badge =
			profileBadges.find(
				(b) =>
					b.badges.family === "level" ||
					b.badges.family === "certifications",
			)?.badges || null;

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
			badge:
				(badge ? await retrieveCleanBadge(event, badge) : null) || null,
			badges: await retrieveSeveralCleanBadges(
				event,
				profileBadges
					.map((b) => b.badges)
					.filter((b): b is NonNullable<typeof b> => b !== null),
			),
			level: profile.level,
			links: links.map((link) => ({
				id: link.id,
				name: link.name,
				type: link.type,
				url: link.url,
				resourceId: link.resourceId,
				resourceName: link.resourceName,
			})),
			stats: {
				followers: stats.followers,
				following: stats.following,
			},
			relationships: r,
		};
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanProfiles(
	event: H3Event,
	identity: Identity | null | undefined,
	_profiles: PartialProfile[],
): Promise<Profile[]> {
	const { db, client } = createDb();

	try {
		const relationships = await getSeveralRelationshipStatus(
			event,
			identity,
			_profiles,
		);
		const privacy = await getSeveralPrivacySettings(event, _profiles);

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

		const every_badges = (
			await db
				.select()
				.from(badgesEntitlements)
				.where(
					inArray(
						badgesEntitlements.profileId,
						_profiles.map((p) => p.id),
					),
				)
				.innerJoin(badges, eq(badges.id, badgesEntitlements.badgeId))
		).filter((badge): badge is NonNullable<typeof badge> => badge !== null);

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
			const relationship = relationships[profile.id!]!;
			const access = accesses[profile.id]!;
			const links = every_links.filter(
				(link) => link.profileId === profile.id,
			);

			const { blocked, friended, ...r } = relationship;

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
					badges: [],
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

			const badge =
				every_badges
					.filter(
						(b) =>
							b.badges_entitlements?.profileId === profile.id &&
							b.badges_entitlements?.enabled === true,
					)
					.map((b) => b.badges)
					.find(
						(b) =>
							b?.family === "level" ||
							b?.family === "certifications",
					) || null;

			const profileBadges = every_badges
				.filter(
					(b) =>
						b.badges_entitlements?.profileId === profile.id &&
						b.badges_entitlements?.enabled === true,
				)
				.map((b) => b.badges)
				.filter((b): b is NonNullable<typeof b> => b !== null);

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
				badge:
					(badge ? await retrieveCleanBadge(event, badge) : null) ||
					null,
				badges: await retrieveSeveralCleanBadges(event, profileBadges),
				level: profile.level,
				links: links.map((link) => ({
					id: link.id,
					name: link.name,
					type: link.type,
					url: link.url,
					resourceId: link.resourceId,
					resourceName: link.resourceName,
				})),
				stats: {
					followers: stats.followers,
					following: stats.following,
				},
				relationships: r,
			});
		}

		return result;
	} finally {
		await client.end();
	}
}
