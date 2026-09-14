import type { H3Event } from "h3";
import { eq, inArray } from "drizzle-orm";

import { createDb } from "#server/db";

import {
	postNotifications,
	whisperNotifications,
	followNotifications,
	accountSanctionNotifications,
	postSanctionNotifications,
	reportNotifications,
} from "#server/db/schema/inbox";

import { profiles } from "#server/db/schema/profiles";
import { posts, whispers } from "#server/db/schema/interactions";
import { sanctions } from "#server/db/schema/sanctions";
import {
	profileReports,
	postReports,
	whisperReports,
} from "#server/db/schema/reports";

import {
	retrieveCleanProfile,
	retrieveSeveralCleanProfiles,
} from "#server/utils/converters/profiles";

import {
	retrieveCleanPost,
	retrieveSeveralCleanPosts,
	retrieveCleanWhisper,
	retrieveSeveralCleanWhispers,
} from "#server/utils/converters/interactions";

import {
	retrieveCleanSanction,
	retrieveSeveralCleanSanctions,
} from "#server/utils/converters/sanctions";

import {
	retrieveCleanProfileReport,
	retrieveSeveralCleanProfileReports,
	retrieveCleanPostReport,
	retrieveSeveralCleanPostReports,
	retrieveCleanWhisperReport,
	retrieveSeveralCleanWhisperReports,
} from "#server/utils/converters/reports";

import type {
	PostNotification,
	WhisperNotification,
	FollowNotification,
	AccountSanctionNotification,
	PostSanctionNotification,
	ReportNotification,
} from "~~/shared/models/inbox";

/*
 * POST NOTIFICATIONS
 */

export async function retrieveCleanPostNotification(
	event: H3Event,
	identity: Identity | null | undefined,
	notification: typeof postNotifications.$inferSelect,
): Promise<PostNotification> {
	const { db, client } = createDb();

	try {
		const { issuerId, postId, ...notificationWithoutParasites } =
			notification;

		if (!issuerId || !postId) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to retrieve post notification issuer or post",
			});
		}

		const [issuer, post] = await Promise.all([
			db
				.select()
				.from(profiles)
				.where(eq(profiles.id, issuerId))
				.limit(1)
				.then(([profile]) => profile),

			db
				.select()
				.from(posts)
				.where(eq(posts.id, postId))
				.limit(1)
				.then(([post]) => post),
		]);

		if (!issuer || !post) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to retrieve post notification issuer or post",
			});
		}

		const [cleanIssuer] = await retrieveSeveralCleanProfiles(
			event,
			identity,
			[issuer],
		);

		const [cleanPost] = await retrieveSeveralCleanPosts(event, identity, [
			post,
		]);

		if (!cleanIssuer || !cleanPost) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to convert post notification issuer or post",
			});
		}

		return {
			...notificationWithoutParasites,
			issuer: cleanIssuer,
			post: cleanPost,
		};
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanPostNotifications(
	event: H3Event,
	identity: Identity | null | undefined,
	_notifications: (typeof postNotifications.$inferSelect)[],
): Promise<PostNotification[]> {
	const { db, client } = createDb();

	try {
		if (_notifications.length === 0) {
			return [];
		}

		const postsIds = _notifications
			.map((notification) => notification.postId)
			.filter((id): id is string => id !== null);

		const issuerIds = _notifications
			.map((notification) => notification.issuerId)
			.filter((id): id is string => id !== null);

		const [_posts, _issuers] = await Promise.all([
			db.select().from(posts).where(inArray(posts.id, postsIds)),

			db.select().from(profiles).where(inArray(profiles.id, issuerIds)),
		]);

		const [cleanPosts, cleanIssuers] = await Promise.all([
			retrieveSeveralCleanPosts(event, identity, _posts),
			retrieveSeveralCleanProfiles(event, identity, _issuers),
		]);

		const postsMap = new Map(cleanPosts.map((post) => [post.id, post]));

		const issuersMap = new Map(
			cleanIssuers.map((profile) => [profile.id, profile]),
		);

		const result: PostNotification[] = [];

		for (const notification of _notifications) {
			const post = notification.postId
				? postsMap.get(notification.postId)
				: undefined;

			const issuer = notification.issuerId
				? issuersMap.get(notification.issuerId)
				: undefined;

			if (!post || !issuer) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Failed to retrieve post notification issuer or post",
				});
			}

			const {
				profileId,
				issuerId,
				postId,
				...notificationWithoutParasites
			} = notification;

			result.push({
				...notificationWithoutParasites,
				issuer,
				post,
			});
		}

		return result;
	} finally {
		await client.end();
	}
}

/*
 * WHISPER NOTIFICATIONS
 */

export async function retrieveCleanWhisperNotification(
	event: H3Event,
	identity: Identity | null | undefined,
	notification: typeof whisperNotifications.$inferSelect,
): Promise<WhisperNotification> {
	const { db, client } = createDb();

	try {
		const { issuerId, whisperId, ...notificationWithoutParasites } =
			notification;

		if (!issuerId || !whisperId) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to retrieve whisper notification issuer or whisper",
			});
		}

		const [issuer, whisper] = await Promise.all([
			db
				.select()
				.from(profiles)
				.where(eq(profiles.id, issuerId))
				.limit(1)
				.then(([profile]) => profile),

			db
				.select()
				.from(whispers)
				.where(eq(whispers.id, whisperId))
				.limit(1)
				.then(([whisper]) => whisper),
		]);

		if (!issuer || !whisper) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to retrieve whisper notification issuer or whisper",
			});
		}

		const [cleanIssuer] = await retrieveSeveralCleanProfiles(
			event,
			identity,
			[issuer],
		);

		const [cleanWhisper] = await retrieveSeveralCleanWhispers(
			event,
			identity,
			[whisper],
		);

		if (!cleanIssuer || !cleanWhisper) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to convert whisper notification issuer or whisper",
			});
		}

		return {
			...notificationWithoutParasites,
			issuer: cleanIssuer,
			whisper: cleanWhisper,
		};
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanWhisperNotifications(
	event: H3Event,
	identity: Identity | null | undefined,
	_notifications: (typeof whisperNotifications.$inferSelect)[],
): Promise<WhisperNotification[]> {
	const { db, client } = createDb();

	try {
		if (_notifications.length === 0) {
			return [];
		}

		const whisperIds = _notifications
			.map((notification) => notification.whisperId)
			.filter((id): id is string => id !== null);

		const issuerIds = _notifications
			.map((notification) => notification.issuerId)
			.filter((id): id is string => id !== null);

		const [_whispers, _issuers] = await Promise.all([
			db.select().from(whispers).where(inArray(whispers.id, whisperIds)),

			db.select().from(profiles).where(inArray(profiles.id, issuerIds)),
		]);

		const [cleanWhispers, cleanIssuers] = await Promise.all([
			retrieveSeveralCleanWhispers(event, identity, _whispers),
			retrieveSeveralCleanProfiles(event, identity, _issuers),
		]);

		const whispersMap = new Map(
			cleanWhispers.map((whisper) => [whisper.id, whisper]),
		);

		const issuersMap = new Map(
			cleanIssuers.map((profile) => [profile.id, profile]),
		);

		const result: WhisperNotification[] = [];

		for (const notification of _notifications) {
			const whisper = notification.whisperId
				? whispersMap.get(notification.whisperId)
				: undefined;

			const issuer = notification.issuerId
				? issuersMap.get(notification.issuerId)
				: undefined;

			if (!whisper || !issuer) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Failed to retrieve whisper notification issuer or whisper",
				});
			}

			const {
				profileId,
				issuerId,
				whisperId,
				...notificationWithoutParasites
			} = notification;

			result.push({
				...notificationWithoutParasites,
				issuer,
				whisper,
			});
		}

		return result;
	} finally {
		await client.end();
	}
}

/*
 * FOLLOW NOTIFICATIONS
 */

export async function retrieveCleanFollowNotification(
	event: H3Event,
	identity: Identity | null | undefined,
	notification: typeof followNotifications.$inferSelect,
): Promise<FollowNotification> {
	const { db, client } = createDb();

	try {
		const { profileId, issuerId, ...notificationWithoutParasites } =
			notification;

		if (!issuerId) {
			throw createError({
				statusCode: 500,
				statusMessage: "Follow notification has no issuer",
			});
		}

		const [profile, issuer] = await Promise.all([
			db
				.select()
				.from(profiles)
				.where(eq(profiles.id, profileId))
				.limit(1)
				.then(([profile]) => profile),

			db
				.select()
				.from(profiles)
				.where(eq(profiles.id, issuerId))
				.limit(1)
				.then(([profile]) => profile),
		]);

		if (!profile || !issuer) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to retrieve follow notification profiles",
			});
		}

		const cleanProfiles = await retrieveSeveralCleanProfiles(
			event,
			identity,
			[profile, issuer],
		);

		const cleanProfile = cleanProfiles.find(
			(profile) => profile.id === profileId,
		);

		const cleanIssuer = cleanProfiles.find(
			(profile) => profile.id === issuerId,
		);

		if (!cleanProfile || !cleanIssuer) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to convert follow notification profiles",
			});
		}

		return {
			...notificationWithoutParasites,
			profile: cleanProfile,
			issuer: cleanIssuer,
		};
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanFollowNotifications(
	event: H3Event,
	identity: Identity | null | undefined,
	_notifications: (typeof followNotifications.$inferSelect)[],
): Promise<FollowNotification[]> {
	const { db, client } = createDb();

	try {
		if (_notifications.length === 0) {
			return [];
		}

		const profileIds = [
			...new Set(
				_notifications.flatMap((notification) =>
					[notification.profileId, notification.issuerId].filter(
						(id): id is string => id !== null,
					),
				),
			),
		];

		const _profiles = await db
			.select()
			.from(profiles)
			.where(inArray(profiles.id, profileIds));

		const cleanProfiles = await retrieveSeveralCleanProfiles(
			event,
			identity,
			_profiles,
		);

		const profilesMap = new Map(
			cleanProfiles.map((profile) => [profile.id, profile]),
		);

		const result: FollowNotification[] = [];

		for (const notification of _notifications) {
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

			const { profileId, issuerId, ...notificationWithoutParasites } =
				notification;

			result.push({
				...notificationWithoutParasites,
				profile,
				issuer,
			});
		}

		return result;
	} finally {
		await client.end();
	}
}

/*
 * ACCOUNT SANCTION NOTIFICATIONS
 */

export async function retrieveCleanAccountSanctionNotification(
	event: H3Event,
	identity: Identity | null | undefined,
	notification: typeof accountSanctionNotifications.$inferSelect,
): Promise<AccountSanctionNotification> {
	const { db, client } = createDb();

	try {
		const { profileId, sanctionId, ...notificationWithoutParasites } =
			notification;

		const [profile, sanction] = await Promise.all([
			db
				.select()
				.from(profiles)
				.where(eq(profiles.id, profileId))
				.limit(1)
				.then(([profile]) => profile),

			db
				.select()
				.from(sanctions)
				.where(eq(sanctions.id, sanctionId))
				.limit(1)
				.then(([sanction]) => sanction),
		]);

		if (!profile || !sanction) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to retrieve account sanction notification data",
			});
		}

		const [cleanProfile] = await retrieveSeveralCleanProfiles(
			event,
			identity,
			[profile],
		);

		const cleanSanction = await retrieveCleanSanction(
			event,
			identity,
			sanction,
		);

		if (!cleanProfile) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to convert account sanction notification profile",
			});
		}

		return {
			...notificationWithoutParasites,
			profile: cleanProfile,
			sanction: cleanSanction,
		};
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanAccountSanctionNotifications(
	event: H3Event,
	identity: Identity | null | undefined,
	_notifications: (typeof accountSanctionNotifications.$inferSelect)[],
): Promise<AccountSanctionNotification[]> {
	const { db, client } = createDb();

	try {
		if (_notifications.length === 0) {
			return [];
		}

		const profileIds = _notifications.map(
			(notification) => notification.profileId,
		);

		const sanctionIds = _notifications.map(
			(notification) => notification.sanctionId,
		);

		const [_profiles, _sanctions] = await Promise.all([
			db.select().from(profiles).where(inArray(profiles.id, profileIds)),

			db
				.select()
				.from(sanctions)
				.where(inArray(sanctions.id, sanctionIds)),
		]);

		const [cleanProfiles, cleanSanctions] = await Promise.all([
			retrieveSeveralCleanProfiles(event, identity, _profiles),
			retrieveSeveralCleanSanctions(event, identity, _sanctions),
		]);

		const profilesMap = new Map(
			cleanProfiles.map((profile) => [profile.id, profile]),
		);

		const sanctionsMap = new Map(
			cleanSanctions.map((sanction) => [sanction.id, sanction]),
		);

		const result: AccountSanctionNotification[] = [];

		for (const notification of _notifications) {
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
				...notificationWithoutParasites
			} = notification;

			result.push({
				...notificationWithoutParasites,
				profile,
				sanction,
			});
		}

		return result;
	} finally {
		await client.end();
	}
}

/*
 * POST SANCTION NOTIFICATIONS
 */

export async function retrieveCleanPostSanctionNotification(
	event: H3Event,
	identity: Identity | null | undefined,
	notification: typeof postSanctionNotifications.$inferSelect,
): Promise<PostSanctionNotification> {
	const { db, client } = createDb();

	try {
		const {
			postId,
			issuerId,
			sanctionId,
			reason,
			details,
			...notificationWithoutParasites
		} = notification;

		const [post, issuer] = await Promise.all([
			db
				.select()
				.from(posts)
				.where(eq(posts.id, postId))
				.limit(1)
				.then(([post]) => post),

			issuerId
				? db
						.select()
						.from(profiles)
						.where(eq(profiles.id, issuerId))
						.limit(1)
						.then(([profile]) => profile)
				: Promise.resolve(null),
		]);

		if (!post) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to retrieve post sanction notification post",
			});
		}

		const [cleanPost] = await retrieveSeveralCleanPosts(event, identity, [
			post,
		]);

		let cleanIssuer;

		if (issuer) {
			[cleanIssuer] = await retrieveSeveralCleanProfiles(
				event,
				identity,
				[issuer],
			);
		}

		if (!cleanPost) {
			throw createError({
				statusCode: 500,
				statusMessage:
					"Failed to convert post sanction notification post",
			});
		}

		return {
			...notificationWithoutParasites,
			post: cleanPost,
			...(cleanIssuer ? { issuer: cleanIssuer } : {}),
		};
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanPostSanctionNotifications(
	event: H3Event,
	identity: Identity | null | undefined,
	_notifications: (typeof postSanctionNotifications.$inferSelect)[],
): Promise<PostSanctionNotification[]> {
	const { db, client } = createDb();

	try {
		if (_notifications.length === 0) {
			return [];
		}

		const postIds = _notifications.map(
			(notification) => notification.postId,
		);

		const issuerIds = _notifications
			.map((notification) => notification.issuerId)
			.filter((id): id is string => id !== null);

		const [_posts, _issuers] = await Promise.all([
			db.select().from(posts).where(inArray(posts.id, postIds)),

			issuerIds.length > 0
				? db
						.select()
						.from(profiles)
						.where(inArray(profiles.id, issuerIds))
				: Promise.resolve([]),
		]);

		const [cleanPosts, cleanIssuers] = await Promise.all([
			retrieveSeveralCleanPosts(event, identity, _posts),
			retrieveSeveralCleanProfiles(event, identity, _issuers),
		]);

		const postsMap = new Map(cleanPosts.map((post) => [post.id, post]));

		const issuersMap = new Map(
			cleanIssuers.map((profile) => [profile.id, profile]),
		);

		const result: PostSanctionNotification[] = [];

		for (const notification of _notifications) {
			const post = postsMap.get(notification.postId);

			if (!post) {
				throw createError({
					statusCode: 500,
					statusMessage:
						"Failed to retrieve post sanction notification post",
				});
			}

			const {
				profileId,
				issuerId,
				postId,
				sanctionId,
				reason,
				details,
				...notificationWithoutParasites
			} = notification;

			result.push({
				...notificationWithoutParasites,
				post,
				...(issuerId ? { issuer: issuersMap.get(issuerId) } : {}),
			});
		}

		return result;
	} finally {
		await client.end();
	}
}

/*
 * REPORT NOTIFICATIONS
 */

export async function retrieveCleanReportNotification(
	event: H3Event,
	identity: Identity | null | undefined,
	notification: typeof reportNotifications.$inferSelect,
): Promise<ReportNotification> {
	const { db, client } = createDb();

	try {
		const {
			profileReportId,
			postReportId,
			whisperReportId,
			...notificationWithoutParasites
		} = notification;

		const [profileReport, postReport, whisperReport] = await Promise.all([
			profileReportId
				? db
						.select()
						.from(profileReports)
						.where(eq(profileReports.id, profileReportId))
						.limit(1)
						.then(([report]) => report)
				: Promise.resolve(null),

			postReportId
				? db
						.select()
						.from(postReports)
						.where(eq(postReports.id, postReportId))
						.limit(1)
						.then(([report]) => report)
				: Promise.resolve(null),

			whisperReportId
				? db
						.select()
						.from(whisperReports)
						.where(eq(whisperReports.id, whisperReportId))
						.limit(1)
						.then(([report]) => report)
				: Promise.resolve(null),
		]);

		const result: ReportNotification = {
			...notificationWithoutParasites,
		};

		if (profileReport) {
			const cleanReport = await retrieveCleanProfileReport(
				event,
				identity,
				profileReport,
			);

			if (cleanReport.reportedProfile) {
				result.reportedProfile = cleanReport.reportedProfile;
			}
		}

		if (postReport) {
			const cleanReport = await retrieveCleanPostReport(
				event,
				identity,
				postReport,
			);

			if (cleanReport.reportedPost) {
				result.reportedPost = cleanReport.reportedPost;
			}
		}

		if (whisperReport) {
			const cleanReport = await retrieveCleanWhisperReport(
				event,
				identity,
				whisperReport,
			);

			if (cleanReport.reportedWhisper) {
				result.reportedWhisper = cleanReport.reportedWhisper;
			}
		}

		return result;
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanReportNotifications(
	event: H3Event,
	identity: Identity | null | undefined,
	_notifications: (typeof reportNotifications.$inferSelect)[],
): Promise<ReportNotification[]> {
	const { db, client } = createDb();

	try {
		if (_notifications.length === 0) {
			return [];
		}

		const profileReportIds = _notifications
			.map((notification) => notification.profileReportId)
			.filter((id): id is string => id !== null);

		const postReportIds = _notifications
			.map((notification) => notification.postReportId)
			.filter((id): id is string => id !== null);

		const whisperReportIds = _notifications
			.map((notification) => notification.whisperReportId)
			.filter((id): id is string => id !== null);

		const [_profileReports, _postReports, _whisperReports] =
			await Promise.all([
				profileReportIds.length > 0
					? db
							.select()
							.from(profileReports)
							.where(inArray(profileReports.id, profileReportIds))
					: Promise.resolve([]),

				postReportIds.length > 0
					? db
							.select()
							.from(postReports)
							.where(inArray(postReports.id, postReportIds))
					: Promise.resolve([]),

				whisperReportIds.length > 0
					? db
							.select()
							.from(whisperReports)
							.where(inArray(whisperReports.id, whisperReportIds))
					: Promise.resolve([]),
			]);

		const [cleanProfileReports, cleanPostReports, cleanWhisperReports] =
			await Promise.all([
				retrieveSeveralCleanProfileReports(
					event,
					identity,
					_profileReports,
				),

				retrieveSeveralCleanPostReports(event, identity, _postReports),

				retrieveSeveralCleanWhisperReports(
					event,
					identity,
					_whisperReports,
				),
			]);

		const profileReportsMap = new Map(
			cleanProfileReports.map((report) => [report.id, report]),
		);

		const postReportsMap = new Map(
			cleanPostReports.map((report) => [report.id, report]),
		);

		const whisperReportsMap = new Map(
			cleanWhisperReports.map((report) => [report.id, report]),
		);

		const result: ReportNotification[] = [];

		for (const notification of _notifications) {
			const {
				profileId,
				issuerId,
				profileReportId,
				postReportId,
				whisperReportId,
				...notificationWithoutParasites
			} = notification;

			const profileReport = profileReportId
				? profileReportsMap.get(profileReportId)
				: undefined;

			const postReport = postReportId
				? postReportsMap.get(postReportId)
				: undefined;

			const whisperReport = whisperReportId
				? whisperReportsMap.get(whisperReportId)
				: undefined;

			result.push({
				...notificationWithoutParasites,
				...(profileReport?.reportedProfile
					? {
							reportedProfile: profileReport.reportedProfile,
						}
					: {}),
				...(postReport?.reportedPost
					? {
							reportedPost: postReport.reportedPost,
						}
					: {}),
				...(whisperReport?.reportedWhisper
					? {
							reportedWhisper: whisperReport.reportedWhisper,
						}
					: {}),
			});
		}

		return result;
	} finally {
		await client.end();
	}
}
