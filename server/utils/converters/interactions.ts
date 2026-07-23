import { db } from "~~/server/db";
import { eq, inArray, count } from "drizzle-orm";

import {
	type Post as DbPost,
	type PostReaction as DbPostReaction,
	type PostFlag as DbPostFlag,
	type Status as DbStatus,
	type StatusReaction as DbStatusReaction,
	postReactions,
	postsFlags,
} from "~~/server/db/schema/interactions";

import { profiles } from "~~/server/db/schema/profiles";
import { attachments } from "~~/server/db/schema/drive";
import { posts } from "~~/server/db/schema/interactions";

import type {
	Post,
	PostFlag,
	PostReaction,
	PostReactionType,
	Status,
	StatusReaction,
} from "~~/shared/models/interactions";

import { Profile } from "~~/shared/models/profiles";

import { retrieveCleanProfile } from "~~/server/utils/converters/profiles";

export async function retrieveCleanPost(
	identity: Identity | null | undefined,
	post: DbPost,
): Promise<Post> {
	const author = await db.query.profiles.findFirst({
		where: (profile, { eq }) => eq(profile.id, post.profileId),
	});

	if (!author) {
		throw new Error("Author not found");
	}

	const profile = await retrieveCleanProfile(identity, author);

	const relationships = await getRelationshipStatus(identity, author);
	const privacy = await getPrivacySettings(author);
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
		.from(postsFlags)
		.where(eq(postsFlags.postId, post.id));

	const shouldTruncate = !access;

	return {
		id: post.id,
		profile: profile,
		parentId: post.parentId ?? null,
		content: shouldTruncate ? "" : post.content,
		visibility: post.visibility,
		createdAt: post.createdAt,
		attachments: shouldTruncate ? [] : files,
		flags: flags.map((flag) => convertPostFlag(flag)),
		stats: {
			reactions: reactions.reduce(
				(acc, reaction) => {
					acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
					return acc;
				},
				{} as Record<PostReactionType, number>,
			),
			answers: answers?.count || 0,
		},
	};
}

export async function retrieveSeveralCleanPosts(
	identity: Identity | null | undefined,
	dbPosts: DbPost[],
): Promise<Post[]> {
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
		identity,
		_dbauthors,
	);
	const authors: Record<string, Profile> = {};

	for (const author of authors_list) {
		authors[author.id] = author;
	}

	// Relations & accès
	const all_relationships = await getSeveralRelationshipStatus(
		identity,
		_dbauthors,
	);
	const all_privacy = await getSeveralPrivacySettings(_dbauthors);

	// Pièces jointes
	const allAttachments = await db
		.select()
		.from(attachments)
		.where(inArray(attachments.postId, dbPosts.map((p) => p.id)));

	const attachmentsMap = groupBy(allAttachments, (a) => a.postId);

	// Réactions
	const allReactions = await db
		.select()
		.from(postReactions)
		.where(inArray(postReactions.postId, dbPosts.map((p) => p.id)));

	const reactionsMap = groupBy(allReactions, (r) => r.postId);

	// Flags
	const allFlags = await db
		.select()
		.from(postsFlags)
		.where(inArray(postsFlags.postId, dbPosts.map((p) => p.id)));

	const flagsMap = groupBy(allFlags, (f) => f.postId);

	// Nombre de réponses
	const answerCounts = await db
		.select({
			parentId: posts.parentId,
			count: count(),
		})
		.from(posts)
		.where(inArray(posts.parentId, dbPosts.map((p) => p.id)))
		.groupBy(posts.parentId);

	const answersMap = new Map(answerCounts.map((a) => [a.parentId!, a.count]));

	return dbPosts.map((post) => {
		const author = authors[post.profileId];

		if (!author) {
			throw new Error("Author not found");
		}

		const relationship = all_relationships[author.id]!;
		const privacy = all_privacy[author.id]!;

		const access = canAccessEntity(
			privacy,
			relationship,
			post.visibility,
		);

		const reactions = reactionsMap.get(post.id) ?? [];
		const flags = flagsMap.get(post.id) ?? [];
		const files = access ? (attachmentsMap.get(post.id) ?? []) : [];

		return {
			id: post.id,
			profile: author,
			parentId: post.parentId ?? null,
			content: access ? post.content : "",
			visibility: post.visibility,
			createdAt: post.createdAt,
			attachments: files,
			flags: flags.map(convertPostFlag),
			stats: {
				reactions: reactions.reduce(
					(acc, reaction) => {
						acc[reaction.reaction] =
							(acc[reaction.reaction] ?? 0) + 1;
						return acc;
					},
					{} as Record<PostReactionType, number>,
				),
				answers: answersMap.get(post.id) ?? 0,
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

export async function retrieveCleanStatus(
	identity: Identity | null | undefined,
	status: DbStatus,
): Promise<Status> {
	const author = await db.query.profiles.findFirst({
		where: (profile, { eq }) => eq(profile.id, status.profileId),
	});

	if (!author) {
		throw new Error("Author not found");
	}

	const profile = await retrieveCleanProfile(identity, author);

	const relationships = await getRelationshipStatus(identity, author);
	const privacy = await getPrivacySettings(author);
	const access = await canAccessEntity(
		privacy,
		relationships,
		status.visibility,
	);

	const shouldTruncate = !access;

	const image = status.image
		? (
				await db
					.select()
					.from(attachments)
					.where(eq(attachments.id, status.image))
			)[0]
		: null;

	return {
		id: status.id,
		profile,
		content: shouldTruncate ? "" : status.content,
		image: image
			? convertAttachment(image, { truncate: shouldTruncate })
			: null,
		color: status.color,
		textColor: status.textColor,
		visibility: status.visibility,
		createdAt: status.createdAt,
	};
}

export function convertStatusReaction(
	reaction: DbStatusReaction,
): StatusReaction {
	return {
		id: reaction.id,
		statusId: reaction.statusId,
		profileId: reaction.profileId,
		reaction: reaction.reaction,
		createdAt: reaction.createdAt,
	};
}
