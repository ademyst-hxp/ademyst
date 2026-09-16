import { and, eq, count, inArray } from "drizzle-orm";

import { createDb } from "#server/db";
import type { H3Event } from "h3";

import type { Profile as PartialProfile } from "~~/server/db/schema/profiles";

import { profileLinks } from "#server/db/schema/profiles";

import { follows } from "#server/db/schema/relations";

import { badges } from "~~/server/db/schema/shop";

import {
	badgesEntitlements,
	levelsEntitlements,
} from "~~/server/db/schema/entitlements";

import type { Profile } from "~~/shared/models/profiles";

import {
	retrieveCleanBadge,
	retrieveSeveralCleanBadges,
} from "~~/server/utils/converters/shop";

import {
	getRelationshipStatus,
	getSeveralRelationshipStatus,
	getPrivacySettings,
	getSeveralPrivacySettings,
	canAccess,
} from "~~/server/utils/helpers/privacy";

import { getLevelFromEntitlements } from "../auth";

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

		const profileLevels = await db
			.select()
			.from(levelsEntitlements)
			.where(
				and(
					eq(levelsEntitlements.profileId, profile.id),
					eq(levelsEntitlements.enabled, true),
				),
			);

		const level = getLevelFromEntitlements(profileLevels);

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
				level,
				links: [],
				relationships: r,
				stats: {
					followers: 0,
					following: 0,
				},
			};
		}

		const [links, profileBadges, followersResult, followingResult] =
			await Promise.all([
				db
					.select()
					.from(profileLinks)
					.where(eq(profileLinks.profileId, profile.id)),

				db
					.select()
					.from(badgesEntitlements)
					.where(
						and(
							eq(badgesEntitlements.profileId, profile.id),
							eq(badgesEntitlements.enabled, true),
						),
					)
					.innerJoin(
						badges,
						eq(badges.id, badgesEntitlements.badgeId),
					),

				db
					.select({ count: count() })
					.from(follows)
					.where(eq(follows.followingId, profile.id)),

				db
					.select({ count: count() })
					.from(follows)
					.where(eq(follows.followerId, profile.id)),
			]);

		const badge =
			profileBadges.find(
				(b) =>
					b.badges.family === "level" ||
					b.badges.family === "certifications",
			)?.badges ?? null;

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

			badge: badge ? await retrieveCleanBadge(event, badge) : null,

			badges: await retrieveSeveralCleanBadges(
				event,
				profileBadges
					.map((b) => b.badges)
					.filter((b): b is NonNullable<typeof b> => b !== null),
			),

			level,

			links: links.map((link) => ({
				id: link.id,
				name: link.name,
				type: link.type,
				url: link.url,
				resourceId: link.resourceId,
				resourceName: link.resourceName,
			})),

			stats: {
				followers: followersResult[0]?.count ?? 0,
				following: followingResult[0]?.count ?? 0,
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
		if (_profiles.length === 0) {
			return [];
		}

		const profileIds = [...new Set(_profiles.map((profile) => profile.id))];

		/*
		 * Relations / privacy
		 */

		const [
			relationships,
			privacy,
			everyLinks,
			everyBadges,
			everyLevels,
			followersCounts,
			followingCounts,
		] = await Promise.all([
			getSeveralRelationshipStatus(event, identity, _profiles),

			getSeveralPrivacySettings(event, _profiles),

			db
				.select()
				.from(profileLinks)
				.where(inArray(profileLinks.profileId, profileIds)),

			db
				.select()
				.from(badgesEntitlements)
				.where(inArray(badgesEntitlements.profileId, profileIds))
				.innerJoin(badges, eq(badges.id, badgesEntitlements.badgeId)),

			db
				.select()
				.from(levelsEntitlements)
				.where(
					and(
						inArray(levelsEntitlements.profileId, profileIds),
						eq(levelsEntitlements.enabled, true),
					),
				),

			db
				.select({
					followingId: follows.followingId,
					count: count(),
				})
				.from(follows)
				.where(inArray(follows.followingId, profileIds))
				.groupBy(follows.followingId),

			db
				.select({
					followerId: follows.followerId,
					count: count(),
				})
				.from(follows)
				.where(inArray(follows.followerId, profileIds))
				.groupBy(follows.followerId),
		]);

		/*
		 * Maps
		 */

		const linksMap = new Map<string, typeof everyLinks>();

		for (const link of everyLinks) {
			const existing = linksMap.get(link.profileId);

			if (existing) {
				existing.push(link);
			} else {
				linksMap.set(link.profileId, [link]);
			}
		}

		const badgesMap = new Map<string, typeof everyBadges>();

		for (const badge of everyBadges) {
			const profileId = badge.badges_entitlements?.profileId;

			if (!profileId) {
				continue;
			}

			const existing = badgesMap.get(profileId);

			if (existing) {
				existing.push(badge);
			} else {
				badgesMap.set(profileId, [badge]);
			}
		}

		const levelsMap = new Map<string, typeof everyLevels>();

		for (const level of everyLevels) {
			const existing = levelsMap.get(level.profileId);

			if (existing) {
				existing.push(level);
			} else {
				levelsMap.set(level.profileId, [level]);
			}
		}

		const followersMap = new Map(
			followersCounts.map((row) => [row.followingId, row.count]),
		);

		const followingMap = new Map(
			followingCounts.map((row) => [row.followerId, row.count]),
		);

		const result: Profile[] = [];

		for (const profile of _profiles) {
			const relationship = relationships[profile.id];

			if (!relationship) {
				throw new Error(
					`Relationship not found for profile ${profile.id}`,
				);
			}

			const profilePrivacy = privacy[profile.accountId!];

			const access = canAccess(profilePrivacy, relationship);

			const { blocked, friended, ...r } = relationship;

			const levels = levelsMap.get(profile.id) ?? [];

			const level = getLevelFromEntitlements(levels);

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
					level,
					links: [],
					relationships: r,
					stats: {
						followers: 0,
						following: 0,
					},
				});

				continue;
			}

			const links = linksMap.get(profile.id) ?? [];

			const profileBadgeRows = badgesMap.get(profile.id) ?? [];

			const profileBadges = profileBadgeRows
				.map((row) => row.badges)
				.filter(
					(badge): badge is NonNullable<typeof badge> =>
						badge !== null,
				);

			const badge =
				profileBadges.find(
					(badge) =>
						badge.family === "level" ||
						badge.family === "certifications",
				) ?? null;

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

				badge: badge ? await retrieveCleanBadge(event, badge) : null,

				badges: await retrieveSeveralCleanBadges(event, profileBadges),

				level,

				links: links.map((link) => ({
					id: link.id,
					name: link.name,
					type: link.type,
					url: link.url,
					resourceId: link.resourceId,
					resourceName: link.resourceName,
				})),

				stats: {
					followers: followersMap.get(profile.id) ?? 0,
					following: followingMap.get(profile.id) ?? 0,
				},

				relationships: r,
			});
		}

		return result;
	} finally {
		await client.end();
	}
}
