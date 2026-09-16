import { and, count, eq, inArray, or } from "drizzle-orm";

import type { H3Event } from "h3";

import { createDb } from "#server/db";

import {
	type Post as DbPost,
	type PostReaction as DbPostReaction,
	type PostFlag as DbPostFlag,
	type Whisper as DbWhisper,
	type WhisperReaction as DbWhisperReaction,
	postReactions,
	postsFlags,
	posts,
	whispers,
} from "~~/server/db/schema/interactions";

import { postReports } from "~~/server/db/schema/reports";

import { profiles } from "~~/server/db/schema/profiles";

import { attachments } from "~~/server/db/schema/drive";

import type {
	Post,
	PostFlag,
	PostReaction,
	PostReactionType,
	Whisper,
	WhisperReaction,
} from "~~/shared/models/interactions";

import type { Profile } from "~~/shared/models/profiles";

import {
	retrieveCleanProfile,
	retrieveSeveralCleanProfiles,
} from "~~/server/utils/converters/profiles";

import {
	getRelationshipStatus,
	getPrivacySettings,
	getSeveralRelationshipStatus,
	getSeveralPrivacySettings,
	canAccessEntity,
} from "~~/server/utils/helpers/privacy";

import { calculateRatingScore } from "~~/shared/utils/interactions";

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
	const map = new Map<K, T[]>();

	for (const item of items) {
		const k = key(item);
		const arr = map.get(k);

		if (arr) {
			arr.push(item);
		} else {
			map.set(k, [item]);
		}
	}

	return map;
}

export async function retrieveCleanPost(
	event: H3Event,
	identity: Identity | null | undefined,
	post: DbPost,
): Promise<Post> {
	const { db, client } = createDb();

	try {
		const author = await db.query.profiles.findFirst({
			where: (profile, { eq }) => eq(profile.id, post.profileId),
		});

		if (!author) {
			throw new Error("Author not found");
		}

		const profile = await retrieveCleanProfile(event, identity, author);

		const relationships = await getRelationshipStatus(
			event,
			identity,
			author,
		);

		const privacy = await getPrivacySettings(event, author);

		const access = await canAccessEntity(
			privacy,
			relationships,
			post.visibility,
		);

		const [files, reactions, flags, answers, reports] = await Promise.all([
			access
				? db
						.select()
						.from(attachments)
						.where(eq(attachments.postId, post.id))
				: Promise.resolve([]),

			db
				.select()
				.from(postReactions)
				.where(eq(postReactions.postId, post.id)),

			db.select().from(postsFlags).where(eq(postsFlags.postId, post.id)),

			db
				.select({
					count: count(),
				})
				.from(posts)
				.where(eq(posts.parentId, post.id))
				.then(([row]) => row?.count ?? 0),

			db
				.select()
				.from(postReports)
				.where(
					and(
						eq(postReports.reportedPostId, post.id),
						or(
							identity
								? eq(postReports.reporterId, identity.accountId)
								: undefined,
							eq(postReports.status, "pending"),
						),
					),
				),
		]);

		const shouldTruncate = !access;

		const computedReactions = reactions.reduce(
			(acc, reaction) => {
				acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;

				return acc;
			},
			{} as Record<PostReactionType, number>,
		);

		const pendingReports = reports.filter(
			(report) => report.status === "pending",
		);

		const myReports = reports.filter(
			(report) => report.reporterId === identity?.accountId,
		);

		return {
			id: post.id,
			profile,
			parentId: post.parentId ?? null,
			content: shouldTruncate ? "" : post.content,
			visibility: post.visibility,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt,
			attachments: shouldTruncate ? [] : files,

			flags: {
				...flags.reduce(
					(acc, flag) => {
						acc[flag.type] = true;
						return acc;
					},
					{} as Record<PostFlag["type"], boolean>,
				),

				reported: pendingReports.length > 3,
			},

			stats: {
				reactions: computedReactions,
				answers,
				score: calculateRatingScore(
					post.createdAt,
					shouldTruncate ? "" : post.content,
					profile.level ?? 0,
					{
						reactions: computedReactions,
						answers,
					},
				),
			},

			interaction: {
				liked: reactions.some(
					(reaction) =>
						reaction.profileId === identity?.profileId &&
						reaction.reaction === "like",
				),

				reported: myReports.length > 0,

				saved: false,
			},
		};
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanPosts(
	event: H3Event,
	identity: Identity | null | undefined,
	dbPosts: DbPost[],
): Promise<Post[]> {
	const { db, client } = createDb();

	try {
		if (dbPosts.length === 0) {
			return [];
		}

		const postIds = [...new Set(dbPosts.map((post) => post.id))];

		const authorIds = [...new Set(dbPosts.map((post) => post.profileId))];

		/*
		 * Tout ce qui concerne les auteurs est batché.
		 */
		const dbAuthors = await db
			.select()
			.from(profiles)
			.where(inArray(profiles.id, authorIds));

		const [
			authorsList,
			allRelationships,
			allPrivacy,
			allAttachments,
			allReactions,
			allFlags,
			answerCounts,
			allReports,
		] = await Promise.all([
			retrieveSeveralCleanProfiles(event, identity, dbAuthors),

			getSeveralRelationshipStatus(event, identity, dbAuthors),

			getSeveralPrivacySettings(event, dbAuthors),

			db
				.select()
				.from(attachments)
				.where(inArray(attachments.postId, postIds)),

			db
				.select()
				.from(postReactions)
				.where(inArray(postReactions.postId, postIds)),

			db
				.select()
				.from(postsFlags)
				.where(inArray(postsFlags.postId, postIds)),

			db
				.select({
					parentId: posts.parentId,
					count: count(),
				})
				.from(posts)
				.where(inArray(posts.parentId, postIds))
				.groupBy(posts.parentId),

			db
				.select()
				.from(postReports)
				.where(
					and(
						inArray(postReports.reportedPostId, postIds),
						or(
							identity
								? eq(postReports.reporterId, identity.accountId)
								: undefined,
							eq(postReports.status, "pending"),
						),
					),
				),
		]);

		const authors = new Map<string, Profile>(
			authorsList.map((author) => [author.id, author]),
		);

		const attachmentsMap = groupBy(
			allAttachments,
			(attachment) => attachment.postId,
		);

		const reactionsMap = groupBy(
			allReactions,
			(reaction) => reaction.postId,
		);

		const flagsMap = groupBy(allFlags, (flag) => flag.postId);

		const reportsMap = groupBy(
			allReports,
			(report) => report.reportedPostId,
		);

		const answersMap = new Map(
			answerCounts.map((row) => [row.parentId!, row.count]),
		);

		return dbPosts.map((post) => {
			const author = authors.get(post.profileId);

			if (!author) {
				throw new Error("Author not found");
			}

			const relationship = allRelationships[author.id]!;

			const privacy = allPrivacy[author.id]!;

			const access = canAccessEntity(
				privacy,
				relationship,
				post.visibility,
			);

			const reactions = reactionsMap.get(post.id) ?? [];

			const flags = flagsMap.get(post.id) ?? [];

			const files = access ? (attachmentsMap.get(post.id) ?? []) : [];

			const computedReactions = reactions.reduce(
				(acc, reaction) => {
					acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;

					return acc;
				},
				{} as Record<PostReactionType, number>,
			);

			const reports = reportsMap.get(post.id) ?? [];

			const pendingReports = reports.filter(
				(report) => report.status === "pending",
			);

			const myReports = reports.filter(
				(report) => report.reporterId === identity?.accountId,
			);

			const answers = answersMap.get(post.id) ?? 0;

			return {
				id: post.id,
				profile: author,
				parentId: post.parentId ?? null,
				content: access ? post.content : "",
				visibility: post.visibility,
				createdAt: post.createdAt,
				updatedAt: post.updatedAt,

				attachments: files,

				flags: {
					...flags.reduce(
						(acc, flag) => {
							acc[flag.type] = true;

							return acc;
						},
						{} as Record<PostFlag["type"], boolean>,
					),

					reported: pendingReports.length > 3,
				},

				stats: {
					reactions: computedReactions,
					answers,
					score: calculateRatingScore(
						post.createdAt,
						access ? post.content : "",
						author.level ?? 0,
						{
							reactions: computedReactions,
							answers,
						},
					),
				},

				interaction: {
					liked: reactions.some(
						(reaction) =>
							reaction.profileId === identity?.profileId &&
							reaction.reaction === "like",
					),

					reported: myReports.length > 0,

					saved: false,
				},
			};
		});
	} finally {
		await client.end();
	}
}

export function convertPostReaction(reaction: DbPostReaction): PostReaction {
	return reaction;
}

export function convertPostFlag(flag: DbPostFlag): PostFlag {
	return flag;
}

export async function retrieveCleanWhisper(
	event: H3Event,
	identity: Identity | null | undefined,
	whisper: DbWhisper,
): Promise<Whisper> {
	const { db, client } = createDb();

	try {
		const author = await db.query.profiles.findFirst({
			where: (profile, { eq }) => eq(profile.id, whisper.profileId),
		});

		if (!author) {
			throw new Error("Author not found");
		}

		const profile = await retrieveCleanProfile(event, identity, author);

		const relationships = await getRelationshipStatus(
			event,
			identity,
			author,
		);

		const privacy = await getPrivacySettings(event, author);

		const access = await canAccessEntity(
			privacy,
			relationships,
			whisper.visibility,
		);

		const image = whisper.image
			? (
					await db
						.select()
						.from(attachments)
						.where(eq(attachments.id, whisper.image))
				)[0]
			: null;

		const shouldTruncate = !access;

		return {
			id: whisper.id,
			profile,
			content: shouldTruncate ? "" : whisper.content,

			image: image
				? convertAttachment(image, {
						truncate: shouldTruncate,
					})
				: null,

			color: whisper.color,
			textColor: whisper.textColor,
			visibility: whisper.visibility,
			createdAt: whisper.createdAt,
		};
	} finally {
		await client.end();
	}
}

export async function retrieveSeveralCleanWhispers(
	event: H3Event,
	identity: Identity | null | undefined,
	dbWhispers: DbWhisper[],
): Promise<Whisper[]> {
	const { db, client } = createDb();

	try {
		if (dbWhispers.length === 0) {
			return [];
		}

		const authorIds = [
			...new Set(dbWhispers.map((whisper) => whisper.profileId)),
		];

		const imageIds = [
			...new Set(
				dbWhispers
					.map((whisper) => whisper.image)
					.filter((id): id is string => id !== null),
			),
		];

		const dbAuthors = await db
			.select()
			.from(profiles)
			.where(inArray(profiles.id, authorIds));

		const [authorsList, allRelationships, allPrivacy, dbImages] =
			await Promise.all([
				retrieveSeveralCleanProfiles(event, identity, dbAuthors),

				getSeveralRelationshipStatus(event, identity, dbAuthors),

				getSeveralPrivacySettings(event, dbAuthors),

				imageIds.length > 0
					? db
							.select()
							.from(attachments)
							.where(inArray(attachments.id, imageIds))
					: Promise.resolve([]),
			]);

		const authors = new Map(
			authorsList.map((author) => [author.id, author]),
		);

		const images = new Map(dbImages.map((image) => [image.id, image]));

		return dbWhispers.map((whisper) => {
			const author = authors.get(whisper.profileId);

			if (!author) {
				throw new Error("Author not found");
			}

			const relationship = allRelationships[author.id]!;

			const privacy = allPrivacy[author.id]!;

			const access = canAccessEntity(
				privacy,
				relationship,
				whisper.visibility,
			);

			const shouldTruncate = !access;

			const image = whisper.image
				? (images.get(whisper.image) ?? null)
				: null;

			return {
				id: whisper.id,
				profile: author,

				content: shouldTruncate ? "" : whisper.content,

				image: image
					? convertAttachment(image, {
							truncate: shouldTruncate,
						})
					: null,

				color: whisper.color,
				textColor: whisper.textColor,
				visibility: whisper.visibility,
				createdAt: whisper.createdAt,
			};
		});
	} finally {
		await client.end();
	}
}

export function convertWhisperReaction(
	reaction: DbWhisperReaction,
): WhisperReaction {
	return {
		id: reaction.id,
		whisperId: reaction.whisperId,
		profileId: reaction.profileId,
		reaction: reaction.reaction,
		createdAt: reaction.createdAt,
	};
}
