import { useDb } from "#server/db";
import { Post } from "~~/server/db/schema/interactions";
import { postReactions, postVisits } from "~~/server/db/schema/interactions";
import { postReports } from "~~/server/db/schema/reports";
import { and, eq, inArray } from "drizzle-orm";

import type { H3Event } from "h3";

import { Identity } from "../auth";

export type Interaction = {
	liked: boolean;
	saved: boolean;
	reported: boolean;
};

export const getInteractionStatus = async (
	event: H3Event,
	identity: Identity | null,
	post: Post | null,
): Promise<Interaction> => {
	const db = useDb(event);

	const interactions: Interaction = {
		liked: false,
		saved: false,
		reported: false,
	};

	if (!identity || !post) {
		return interactions;
	}

	const [like] = await db
		.select()
		.from(postReactions)
		.where(
			and(
				eq(postReactions.postId, post.id),
				eq(postReactions.profileId, identity.profileId),
			),
		)
		.limit(1);

	if (like) {
		interactions.liked = true;
	}

	const [report] = await db
		.select()
		.from(postReports)
		.where(
			and(
				eq(postReports.reportedPostId, post.id),
				eq(postReports.reporterId, identity.accountId),
			),
		)
		.limit(1);

	if (report) {
		interactions.reported = true;
	}

	return interactions;
};

export const getSeveralInteractionStatus = async (
	event: H3Event,
	identity: Identity | null,
	_posts: Post[],
): Promise<Record<string, Interaction>> => {
	const db = useDb(event);

	const base: Interaction = {
		liked: false,
		saved: false,
		reported: false,
	};

	const interactions: Record<string, Interaction> = {};

	if (!identity) {
		return _posts.reduce(
			(acc, post) => {
				acc[post.id] = { ...base };
				return acc;
			},
			{} as Record<string, Interaction>,
		);
	}

	const likes = await db
		.select()
		.from(postReactions)
		.where(
			and(
				inArray(
					postReactions.postId,
					_posts.map((p) => p.id),
				),
				eq(postReactions.profileId, identity.profileId),
			),
		);

	const reports = await db
		.select()
		.from(postReports)
		.where(
			and(
				inArray(
					postReports.reportedPostId,
					_posts.map((p) => p.id),
				),
				eq(postReports.reporterId, identity.accountId),
			),
		);

	for (const post of _posts) {
		const interaction: Interaction = { ...base };

		const like = likes.find((l) => l.postId === post.id);
		const report = reports.find((r) => r.reportedPostId === post.id);

		if (like) {
			interaction.liked = true;
		}

		if (report) {
			interaction.reported = true;
		}

		interactions[post.id] = interaction;
	}

	return interactions;
};

export const triggerPostVisit = async (
	event: H3Event,
	identity: Identity | null,
	post: Post | null,
) => {
	const db = useDb(event);

	if (!identity || !post) {
		return;
	}

	let [hasVisited] = await db
		.select()
		.from(postVisits)
		.where(
			and(
				eq(postVisits.postId, post.id),
				eq(postVisits.profileId, identity.profileId),
			),
		)
		.limit(1);

	if (!hasVisited) {
		[hasVisited] = await db
			.insert(postVisits)
			.values({
				postId: post.id,
				profileId: identity.profileId,
			})
			.returning();
	}

	const [newVisit] = await db
		.update(postVisits)
		.set({
			timesVisited: (hasVisited?.timesVisited ?? 0) + 1,
			lastVisitedAt: new Date(),
		})
		.where(
			and(
				eq(postVisits.postId, post.id),
				eq(postVisits.profileId, identity.profileId),
			),
		)
		.returning();

	if (!newVisit) {
		throw new Error("Failed to update post visit");
	}
};
