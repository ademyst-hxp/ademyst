import type { H3Event } from "h3";
import { and, eq, inArray, or } from "drizzle-orm";

import { useDb } from "#server/db";

import {
	postNotifications,
	whisperNotifications,
	followNotifications,
	accountSanctionNotifications,
	postSanctionNotifications,
	reportNotifications,
} from "#server/db/schema/inbox";

import { follows, requests } from "#server/db/schema/relations";

import { profiles } from "#server/db/schema/profiles";
import { posts, whispers } from "#server/db/schema/interactions";
import { sanctions } from "#server/db/schema/sanctions";

import {
	profileReports,
	postReports,
	whisperReports,
} from "#server/db/schema/reports";

import { retrieveSeveralCleanProfiles } from "#server/utils/converters/profiles";

import {
	retrieveSeveralCleanPosts,
	retrieveSeveralCleanWhispers,
} from "#server/utils/converters/interactions";

import { retrieveSeveralCleanSanctions } from "#server/utils/converters/sanctions";

import {
	retrieveSeveralCleanProfileReports,
	retrieveSeveralCleanPostReports,
	retrieveSeveralCleanWhisperReports,
} from "#server/utils/converters/reports";

import {
	convertFollow,
	convertRequest,
} from "#server/utils/converters/relations";

import type {
	PostNotification,
	WhisperNotification,
	FollowNotification,
	AccountSanctionNotification,
	PostSanctionNotification,
	ReportNotification,
} from "~~/shared/models/inbox";

/*
 * --------------------------------------------------------------------------
 * TYPES
 * --------------------------------------------------------------------------
 */

type InboxNotifications = {
	accountSanctions: (typeof accountSanctionNotifications.$inferSelect)[];
	postSanctions: (typeof postSanctionNotifications.$inferSelect)[];
	reports: (typeof reportNotifications.$inferSelect)[];
	posts: (typeof postNotifications.$inferSelect)[];
	whispers: (typeof whisperNotifications.$inferSelect)[];
	follows: (typeof followNotifications.$inferSelect)[];
};

export type CleanInboxNotifications = {
	accountSanctions: AccountSanctionNotification[];
	postSanctions: PostSanctionNotification[];
	reports: ReportNotification[];
	posts: PostNotification[];
	whispers: WhisperNotification[];
	follows: FollowNotification[];
};

/*
 * --------------------------------------------------------------------------
 * HELPERS
 * --------------------------------------------------------------------------
 */

function getRelationKey(issuerId: string, profileId: string): string {
	return `${issuerId}:${profileId}`;
}

/*
 * --------------------------------------------------------------------------
 * GLOBAL INBOX CLEANER
 * --------------------------------------------------------------------------
 *
 * Toutes les ressources sont collectées puis chargées en batch.
 *
 * Pour les relations :
 *
 *   request:
 *     issuer -> profile
 *
 *   request_accepted / happened:
 *     issuer -> profile
 *
 * Dans les deux cas, issuer/profile permettent de retrouver la relation.
 *
 * Pour les reports, une notification référence normalement un seul des trois
 * types de reports :
 *
 *   profileReportId
 *   postReportId
 *   whisperReportId
 *
 * --------------------------------------------------------------------------
 */

export async function retrieveCleanInboxNotifications(
	event: H3Event,
	identity: Identity | null | undefined,
	notifications: InboxNotifications,
): Promise<CleanInboxNotifications> {
	const db = useDb(event);

	/*
	 * ------------------------------------------------------------------
	 * 1. COLLECT IDS
	 * ------------------------------------------------------------------
	 */

	const profileIds = new Set<string>();
	const postIds = new Set<string>();
	const whisperIds = new Set<string>();
	const sanctionIds = new Set<string>();

	const profileReportIds = new Set<string>();
	const postReportIds = new Set<string>();
	const whisperReportIds = new Set<string>();

	/*
	 * Posts
	 */

	for (const notification of notifications.posts) {
		if (notification.issuerId) {
			profileIds.add(notification.issuerId);
		}

		if (notification.postId) {
			postIds.add(notification.postId);
		}
	}

	/*
	 * Whispers
	 */

	for (const notification of notifications.whispers) {
		if (notification.issuerId) {
			profileIds.add(notification.issuerId);
		}

		if (notification.whisperId) {
			whisperIds.add(notification.whisperId);
		}
	}

	/*
	 * Relations
	 */

	for (const notification of notifications.follows) {
		profileIds.add(notification.profileId);

		if (notification.issuerId) {
			profileIds.add(notification.issuerId);
		}
	}

	/*
	 * Account sanctions
	 */

	for (const notification of notifications.accountSanctions) {
		profileIds.add(notification.profileId);

		if (notification.sanctionId) {
			sanctionIds.add(notification.sanctionId);
		}
	}

	/*
	 * Post sanctions
	 */

	for (const notification of notifications.postSanctions) {
		if (notification.postId) {
			postIds.add(notification.postId);
		}

		if (notification.sanctionId) {
			sanctionIds.add(notification.sanctionId);
		}
	}

	/*
	 * Reports
	 */

	for (const notification of notifications.reports) {
		if (notification.profileReportId) {
			profileReportIds.add(notification.profileReportId);
		}

		if (notification.postReportId) {
			postReportIds.add(notification.postReportId);
		}

		if (notification.whisperReportId) {
			whisperReportIds.add(notification.whisperReportId);
		}
	}

	/*
	 * ------------------------------------------------------------------
	 * 2. LOAD RAW RESOURCES
	 * ------------------------------------------------------------------
	 */

	const [
		rawProfiles,
		rawPosts,
		rawWhispers,
		rawSanctions,
		rawProfileReports,
		rawPostReports,
		rawWhisperReports,
	] = await Promise.all([
		profileIds.size > 0
			? db
					.select()
					.from(profiles)
					.where(inArray(profiles.id, [...profileIds]))
			: Promise.resolve([]),

		postIds.size > 0
			? db
					.select()
					.from(posts)
					.where(inArray(posts.id, [...postIds]))
			: Promise.resolve([]),

		whisperIds.size > 0
			? db
					.select()
					.from(whispers)
					.where(inArray(whispers.id, [...whisperIds]))
			: Promise.resolve([]),

		sanctionIds.size > 0
			? db
					.select()
					.from(sanctions)
					.where(inArray(sanctions.id, [...sanctionIds]))
			: Promise.resolve([]),

		profileReportIds.size > 0
			? db
					.select()
					.from(profileReports)
					.where(
						inArray(profileReports.id, [...profileReportIds]),
					)
			: Promise.resolve([]),

		postReportIds.size > 0
			? db
					.select()
					.from(postReports)
					.where(inArray(postReports.id, [...postReportIds]))
			: Promise.resolve([]),

		whisperReportIds.size > 0
			? db
					.select()
					.from(whisperReports)
					.where(
						inArray(whisperReports.id, [...whisperReportIds]),
					)
			: Promise.resolve([]),
	]);

	/*
	 * ------------------------------------------------------------------
	 * 3. LOAD RELATIONSHIPS
	 * ------------------------------------------------------------------
	 *
	 * Les notifications ne stockent pas followId/requestId.
	 * On retrouve donc la relation à partir du couple :
	 *
	 *   issuerId -> profileId
	 *
	 * Pour éviter les requêtes une par une, on récupère toutes les
	 * relations impliquant les profiles concernés.
	 * ------------------------------------------------------------------
	 */

	const relationNotifications = notifications.follows.filter(
		(notification) => notification.issuerId !== null,
	);

	const relationIssuerIds = [
		...new Set(
			relationNotifications
				.map((notification) => notification.issuerId)
				.filter((id): id is string => id !== null),
		),
	];

	const relationProfileIds = [
		...new Set(
			relationNotifications.map(
				(notification) => notification.profileId,
			),
		),
	];

	const [rawFollows, rawRequests] = await Promise.all([
		relationIssuerIds.length > 0 && relationProfileIds.length > 0
			? db
					.select()
					.from(follows)
					.where(
						and(
							inArray(follows.followerId, relationIssuerIds),
							inArray(
								follows.followingId,
								relationProfileIds,
							),
						),
					)
			: Promise.resolve([]),

		relationIssuerIds.length > 0 && relationProfileIds.length > 0
			? db
					.select()
					.from(requests)
					.where(
						and(
							inArray(requests.senderId, relationIssuerIds),
							inArray(
								requests.receiverId,
								relationProfileIds,
							),
						),
					)
			: Promise.resolve([]),
	]);

	/*
	 * ------------------------------------------------------------------
	 * 4. CLEAN RESOURCES IN BATCH
	 * ------------------------------------------------------------------
	 */

	const [
		cleanProfiles,
		cleanPosts,
		cleanWhispers,
		cleanSanctions,
		cleanProfileReports,
		cleanPostReports,
		cleanWhisperReports,
	] = await Promise.all([
		rawProfiles.length > 0
			? retrieveSeveralCleanProfiles(event, identity, rawProfiles)
			: Promise.resolve([]),

		rawPosts.length > 0
			? retrieveSeveralCleanPosts(event, identity, rawPosts)
			: Promise.resolve([]),

		rawWhispers.length > 0
			? retrieveSeveralCleanWhispers(event, identity, rawWhispers)
			: Promise.resolve([]),

		rawSanctions.length > 0
			? retrieveSeveralCleanSanctions(event, identity, rawSanctions)
			: Promise.resolve([]),

		rawProfileReports.length > 0
			? retrieveSeveralCleanProfileReports(
					event,
					identity,
					rawProfileReports,
				)
			: Promise.resolve([]),

		rawPostReports.length > 0
			? retrieveSeveralCleanPostReports(
					event,
					identity,
					rawPostReports,
				)
			: Promise.resolve([]),

		rawWhisperReports.length > 0
			? retrieveSeveralCleanWhisperReports(
					event,
					identity,
					rawWhisperReports,
				)
			: Promise.resolve([]),
	]);

	/*
	 * ------------------------------------------------------------------
	 * 5. MAPS
	 * ------------------------------------------------------------------
	 */

	const profilesMap = new Map(
		cleanProfiles.map((profile) => [profile.id, profile]),
	);

	const postsMap = new Map(cleanPosts.map((post) => [post.id, post]));

	const whispersMap = new Map(
		cleanWhispers.map((whisper) => [whisper.id, whisper]),
	);

	const sanctionsMap = new Map(
		cleanSanctions.map((sanction) => [sanction.id, sanction]),
	);

	const followsMap = new Map(
		rawFollows.map((follow) => [
			getRelationKey(follow.followerId, follow.followingId),
			follow,
		]),
	);

	const requestsMap = new Map(
		rawRequests.map((request) => [
			getRelationKey(request.senderId, request.receiverId),
			request,
		]),
	);

	const profileReportsMap = new Map(
		cleanProfileReports.map((report) => [report.id, report]),
	);

	const postReportsMap = new Map(
		cleanPostReports.map((report) => [report.id, report]),
	);

	const whisperReportsMap = new Map(
		cleanWhisperReports.map((report) => [report.id, report]),
	);

	/*
	 * ------------------------------------------------------------------
	 * 6. POST NOTIFICATIONS
	 * ------------------------------------------------------------------
	 */

	const cleanPostsNotifications: PostNotification[] =
		notifications.posts.map((notification) => {
			const post = notification.postId
				? postsMap.get(notification.postId)
				: undefined;

			const issuer = notification.issuerId
				? profilesMap.get(notification.issuerId)
				: undefined;

			if (!post || !issuer) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Failed to retrieve post notification issuer or post",
				});
			}

			const { profileId, issuerId, postId, ...data } = notification;

			return {
				...data,
				post,
				issuer,
			};
		});

	/*
	 * ------------------------------------------------------------------
	 * 7. WHISPER NOTIFICATIONS
	 * ------------------------------------------------------------------
	 */

	const cleanWhisperNotifications: WhisperNotification[] =
		notifications.whispers.map((notification) => {
			const whisper = notification.whisperId
				? whispersMap.get(notification.whisperId)
				: undefined;

			const issuer = notification.issuerId
				? profilesMap.get(notification.issuerId)
				: undefined;

			if (!whisper || !issuer) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Failed to retrieve whisper notification issuer or whisper",
				});
			}

			const { profileId, issuerId, whisperId, ...data } =
				notification;

			return {
				...data,
				whisper,
				issuer,
			};
		});

	/*
	 * ------------------------------------------------------------------
	 * 8. FOLLOW / REQUEST NOTIFICATIONS
	 * ------------------------------------------------------------------
	 */

	const cleanFollowNotifications: FollowNotification[] =
		notifications.follows.map((notification) => {
			const profile = profilesMap.get(notification.profileId);

			const issuer = notification.issuerId
				? profilesMap.get(notification.issuerId)
				: undefined;

			if (!profile || !issuer) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Failed to retrieve follow notification profiles",
				});
			}

			const relationKey = getRelationKey(
				notification.issuerId,
				notification.profileId,
			);

			let relationship:
				FollowNotification["relationship"] | undefined;

			if (notification.type === "request") {
				const request = requestsMap.get(relationKey);

				if (!request) {
					throw createError({
						statusCode: 500,
						statusMessage:
							"Failed to retrieve request relationship",
					});
				}

				const sender = profilesMap.get(request.senderId);

				const receiver = profilesMap.get(request.receiverId);

				if (!sender || !receiver) {
					throw createError({
						statusCode: 500,
						statusMessage:
							"Failed to retrieve request profiles",
					});
				}

				relationship = convertRequest(request, sender, receiver);
			} else {
				const follow = followsMap.get(relationKey);

				if (!follow) {
					throw createError({
						statusCode: 500,
						statusMessage:
							"Failed to retrieve follow relationship",
					});
				}

				const follower = profilesMap.get(follow.followerId);

				const following = profilesMap.get(follow.followingId);

				if (!follower || !following) {
					throw createError({
						statusCode: 500,
						statusMessage: "Failed to retrieve follow profiles",
					});
				}

				relationship = convertFollow(follow, follower, following);
			}

			const { profileId, issuerId, ...data } = notification;

			return {
				...data,
				profile,
				issuer,
				relationship,
			};
		});

	/*
	 * ------------------------------------------------------------------
	 * 9. ACCOUNT SANCTIONS
	 * ------------------------------------------------------------------
	 */

	const cleanAccountSanctions: AccountSanctionNotification[] =
		notifications.accountSanctions.map((notification) => {
			const profile = profilesMap.get(notification.profileId);

			const sanction = sanctionsMap.get(notification.sanctionId);

			if (!profile || !sanction) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Failed to retrieve account sanction notification data",
				});
			}

			const {
				profileId,
				issuerId,
				sanctionId,
				reason,
				details,
				...data
			} = notification;

			return {
				...data,
				profile,
				sanction,
			};
		});

	/*
	 * ------------------------------------------------------------------
	 * 10. POST SANCTIONS
	 * ------------------------------------------------------------------
	 */

	const cleanPostSanctions: PostSanctionNotification[] =
		notifications.postSanctions.map((notification) => {
			const post = postsMap.get(notification.postId);

			const sanction = sanctionsMap.get(notification.sanctionId);

			if (!post || !sanction) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Failed to retrieve post sanction notification data",
				});
			}

			const {
				profileId,
				issuerId,
				postId,
				sanctionId,
				reason,
				details,
				...data
			} = notification;

			return {
				...data,
				post,
				sanction,
			};
		});

	/*
	 * ------------------------------------------------------------------
	 * 11. REPORT NOTIFICATIONS
	 * ------------------------------------------------------------------
	 */

	const cleanReports: ReportNotification[] = notifications.reports.map(
		(notification) => {
			const profileReport = notification.profileReportId
				? (profileReportsMap.get(notification.profileReportId) ??
					null)
				: null;

			const postReport = notification.postReportId
				? (postReportsMap.get(notification.postReportId) ?? null)
				: null;

			const whisperReport = notification.whisperReportId
				? (whisperReportsMap.get(notification.whisperReportId) ??
					null)
				: null;

			/*
			 * Une notification de report doit référencer exactement
			 * un type de report.
			 */

			const reportCount =
				Number(profileReport !== null) +
				Number(postReport !== null) +
				Number(whisperReport !== null);

			if (reportCount !== 1) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Invalid report notification: expected exactly one report",
				});
			}

			const {
				profileId,
				issuerId,
				profileReportId,
				postReportId,
				whisperReportId,
				...data
			} = notification;

			return {
				...data,
				profileReport,
				postReport,
				whisperReport,
			};
		},
	);

	/*
	 * ------------------------------------------------------------------
	 * 12. RETURN
	 * ------------------------------------------------------------------
	 */

	return {
		accountSanctions: cleanAccountSanctions,
		postSanctions: cleanPostSanctions,
		reports: cleanReports,
		posts: cleanPostsNotifications,
		whispers: cleanWhisperNotifications,
		follows: cleanFollowNotifications,
	};
}
