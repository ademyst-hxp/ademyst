import { useDb } from "~~/server/db";
import type { H3Event } from "h3";

import { eq, and, or, inArray, count } from "drizzle-orm";

import {
	type Post as DbPost,
	type PostReaction as DbPostReaction,
	type PostFlag as DbPostFlag,
	type Whisper as DbWhisper,
	type WhisperReaction as DbWhisperReaction,
	postReactions,
	postsFlags,
} from "~~/server/db/schema/interactions";

import { postReports } from "~~/server/db/schema/reports";

import { profiles } from "~~/server/db/schema/profiles";
import { attachments } from "~~/server/db/schema/drive";
import { posts } from "~~/server/db/schema/interactions";

import type {
	Post,
	PostFlag,
	PostReaction,
	PostReactionType,
	Whisper,
	WhisperReaction,
} from "~~/shared/models/interactions";

import { Profile } from "~~/shared/models/profiles";

import { retrieveCleanProfile } from "~~/server/utils/converters/profiles";
import { calculateRatingScore } from "~~/shared/utils/interactions";

export async function retrieveCleanPost(
	event: H3Event,
	identity: Identity | null | undefined,
	post: DbPost,
): Promise<Post> {
	const db = useDb(event);

	const author = await db.query.profiles.findFirst({
		where: (profile, { eq }) => eq(profile.id, post.profileId),
	});

	if (!author) {
		throw new Error("Author not found");
	}

	const profile = await retrieveCleanProfile(event, identity, author);

	const relationships = await getRelationshipStatus(event, identity, author);
	const privacy = await getPrivacySettings(event, author);
	const access = await canAccessEntity(
		privacy,
		relationships,
		post.visibility,
	);

	const files = access
		? await db
				.select()
				.from(attachments)
				.where(eq(attachments.postId, post.id))
		: [];

	const reactions = await db
		.select()
		.from(postReactions)
		.where(eq(postReactions.postId, post.id));
	const flags = await db
		.select()
		.from(postsFlags)
		.where(eq(postsFlags.postId, post.id));
	const [answers] = await db
		.select({ count: count() })
		.from(posts)
		.where(eq(posts.parentId, post.id));

	const shouldTruncate = !access;

	const computedReactions: Record<PostReactionType, number> =
		reactions.reduce(
			(acc, reaction) => {
				acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
				return acc;
			},
			{} as Record<PostReactionType, number>,
		);

	const reports = await db
		.select()
		.from(postReports)
		.where(
			and(
				eq(postReports.reportedPostId, post.id),
				or(
					eq(postReports.reporterId, identity?.accountId || ""),
					eq(postReports.status, "pending"),
				)
			),
		) || [];

	const pendingReports = reports.filter((report) => report.status === "pending");
	const myReports = reports.filter((report) => report.reporterId === identity?.accountId);

	return {
		id: post.id,
		profile: profile,
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
			reported: pendingReports.length > 3, // 3 pour l'instant, augmenter au fur et à mesure que la communauté grandit
		},
		stats: {
			reactions: computedReactions,
			answers: answers?.count || 0,
			score: calculateRatingScore(
				post.createdAt,
				shouldTruncate ? "" : post.content,
				profile.level ?? 0,
				{
					reactions: computedReactions,
					answers: answers?.count || 0,
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
}

export async function retrieveSeveralCleanPosts(
	event: H3Event,
	identity: Identity | null | undefined,
	dbPosts: DbPost[],
): Promise<Post[]> {
	const db = useDb(event);

	if (dbPosts.length === 0) {
		return [];
	}

	const authorIds = [...new Set(dbPosts.map((p) => p.profileId))];

	// Auteurs
	const _dbauthors = await db
		.select()
		.from(profiles)
		.where(inArray(profiles.id, authorIds));

	const authors_list = await retrieveSeveralCleanProfiles(
		event,
		identity,
		_dbauthors,
	);
	const authors: Record<string, Profile> = {};

	for (const author of authors_list) {
		authors[author.id] = author;
	}

	// Relations & accès
	const all_relationships = await getSeveralRelationshipStatus(
		event,
		identity,
		_dbauthors,
	);
	const all_privacy = await getSeveralPrivacySettings(event, _dbauthors);

	// Pièces jointes
	const allAttachments = await db
		.select()
		.from(attachments)
		.where(
			inArray(
				attachments.postId,
				dbPosts.map((p) => p.id),
			),
		);

	const attachmentsMap = groupBy(allAttachments, (a) => a.postId);

	// Réactions
	const allReactions = await db
		.select()
		.from(postReactions)
		.where(
			inArray(
				postReactions.postId,
				dbPosts.map((p) => p.id),
			),
		);

	const reactionsMap = groupBy(allReactions, (r) => r.postId);

	// Flags
	const allFlags = await db
		.select()
		.from(postsFlags)
		.where(
			inArray(
				postsFlags.postId,
				dbPosts.map((p) => p.id),
			),
		);

	const flagsMap = groupBy(allFlags, (f) => f.postId);

	// Nombre de réponses
	const answerCounts = await db
		.select({
			parentId: posts.parentId,
			count: count(),
		})
		.from(posts)
		.where(
			inArray(
				posts.parentId,
				dbPosts.map((p) => p.id),
			),
		)
		.groupBy(posts.parentId);

	const answersMap = new Map(answerCounts.map((a) => [a.parentId!, a.count]));

	const allReports = await db
		.select()
		.from(postReports)
		.where(
			and(
				inArray(
					postReports.reportedPostId,
					dbPosts.map((p) => p.id),
				),
				or(
					eq(postReports.reporterId, identity?.accountId || ""),
					eq(postReports.status, "pending"),
				)
			),
		) || [];

	const reportsMap = groupBy(allReports, (r) => r.reportedPostId);

	return dbPosts.map((post) => {
		const author = authors[post.profileId];

		if (!author) {
			throw new Error("Author not found");
		}

		const relationship = all_relationships[author.id]!;
		const privacy = all_privacy[author.id]!;

		const access = canAccessEntity(privacy, relationship, post.visibility);

		const reactions = reactionsMap.get(post.id) ?? [];
		const flags = flagsMap.get(post.id) ?? [];
		const files = access ? (attachmentsMap.get(post.id) ?? []) : [];

		const computedReactions: Record<PostReactionType, number> =
			reactions.reduce(
				(acc, reaction) => {
					acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
					return acc;
				},
				{} as Record<PostReactionType, number>,
			);

		const computedReports = reportsMap.get(post.id) ?? [];
		const pendingReports = computedReports.filter((report) => report.status === "pending");
		const myReports = computedReports.filter((report) => report.reporterId === identity?.accountId);

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
				reported: pendingReports.length > 3, // 3 pour l'instant, augmenter au fur et à mesure que la communauté grandit
			},
			stats: {
				reactions: computedReactions,
				answers: answersMap.get(post.id) ?? 0,
				score: calculateRatingScore(
					post.createdAt,
					access ? post.content : "",
					author.level ?? 0,
					{
						reactions: computedReactions,
						answers: answersMap.get(post.id) ?? 0,
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
}

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
	const db = useDb(event);

	const author = await db.query.profiles.findFirst({
		where: (profile, { eq }) => eq(profile.id, whisper.profileId),
	});

	if (!author) {
		throw new Error("Author not found");
	}

	const profile = await retrieveCleanProfile(event, identity, author);

	const relationships = await getRelationshipStatus(event, identity, author);
	const privacy = await getPrivacySettings(event, author);
	const access = await canAccessEntity(
		privacy,
		relationships,
		whisper.visibility,
	);

	const shouldTruncate = !access;

	const image = whisper.image
		? (
				await db
					.select()
					.from(attachments)
					.where(eq(attachments.id, whisper.image))
			)[0]
		: null;

	return {
		id: whisper.id,
		profile,
		content: shouldTruncate ? "" : whisper.content,
		image: image
			? convertAttachment(image, { truncate: shouldTruncate })
			: null,
		color: whisper.color,
		textColor: whisper.textColor,
		visibility: whisper.visibility,
		createdAt: whisper.createdAt,
	};
}

export async function retrieveSeveralCleanWhispers(
	event: H3Event,
	identity: Identity | null | undefined,
	dbWhispers: DbWhisper[],
): Promise<Whisper[]> {
	const db = useDb(event);

	if (dbWhispers.length === 0) {
		return [];
	}

	const authorIds = [...new Set(dbWhispers.map((s) => s.profileId))];

	// Auteurs
	const dbAuthors = await db
		.select()
		.from(profiles)
		.where(inArray(profiles.id, authorIds));

	const authorsList = await retrieveSeveralCleanProfiles(
		event,
		identity,
		dbAuthors,
	);

	const authors: Record<string, Profile> = {};

	for (const author of authorsList) {
		authors[author.id] = author;
	}

	// Relations & confidentialité
	const allRelationships = await getSeveralRelationshipStatus(
		event,
		identity,
		dbAuthors,
	);

	const allPrivacy = await getSeveralPrivacySettings(event, dbAuthors);

	// Images
	const imageIds = [
		...new Set(
			dbWhispers
				.map((whisper) => whisper.image)
				.filter((id): id is string => id !== null),
		),
	];

	const dbImages =
		imageIds.length > 0
			? await db
					.select()
					.from(attachments)
					.where(inArray(attachments.id, imageIds))
			: [];

	const images = new Map(dbImages.map((image) => [image.id, image]));

	return dbWhispers.map((whisper) => {
		const author = authors[whisper.profileId];

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
