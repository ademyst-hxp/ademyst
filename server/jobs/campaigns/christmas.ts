import type { H3Event } from "h3";

import { useDb } from "~~/server/db";
import { eq, ne, isNotNull, and } from "drizzle-orm";

import {
	christmasQuests as quests,
	christmasQuestCompletions as questCompletions,
} from "~~/server/db/schema/campaigns/christmas";

import {
	posts,
	postReactions,
	whispers,
} from "~~/server/db/schema/interactions";

import { attachments } from "~~/server/db/schema/drive";

import { referrals, referralCodes } from "~~/server/db/schema/referrals";

import type { Profile } from "~~/shared/models/profiles";
import type { Quest } from "~~/shared/models/campaigns/christmas";

async function validateQuest(
	db: ReturnType<typeof useDb>,
	day: Quest["id"],
	profile: Profile["id"],
) {
	const quest = await db.select().from(quests).where(eq(quests.id, day));

	if (!quest) {
		throw new Error(`Quest with day ${day} does not exist`);
	}

	const completion = await db
		.select()
		.from(questCompletions)
		.where(
			and(
				eq(questCompletions.questId, day),
				eq(questCompletions.profileId, profile),
			),
		);

	if (completion) {
		return; // Quest already completed, no need to insert again
	}

	const result = await db
		.insert(questCompletions)
		.values({
			profileId: profile,
			questId: day,
		})
		.returning();

	if (!result) {
		throw new Error(
			`Failed to insert quest completion for profile ${profile} and quest ${day}`,
		);
	}
}

export async function triggerQuestUpdate(
	event: H3Event,
	day: Quest["id"],
	profile: Profile["id"],
): Promise<void> {
	const db = useDb(event);

	let trigger = async () => {};

	switch (day) {
		case 1:
		case 12:
			trigger = async () => {
				const candidates = await db
					.select()
					.from(posts)
					.where(
						and(
							eq(posts.profileId, profile),
							eq(posts.createdAt, new Date(`2026-12-${day.toString().padStart(2, "0")}`)),
						),
					);

				if (candidates.length >= 2)
					await validateQuest(db, day, profile);
			};

			break;

		case 3:
			trigger = async () => {
				const candidates = await db
					.select()
					.from(postReactions)
					.where(
						and(
							eq(postReactions.profileId, profile),
							eq(postReactions.createdAt, new Date("2026-12-03")),
						),
					);

				if (candidates.length >= 5)
					await validateQuest(db, day, profile);
			};

			break;

		case 5:
			trigger = async () => {
				const candidates = await db
					.select()
					.from(attachments)
					.where(
						and(
							eq(attachments.authorId, profile),
							eq(attachments.type, "link"),
							eq(attachments.createdAt, new Date("2026-12-05")),
						),
					);

				const allPosts = new Set(
					candidates.map((attachment) => attachment.postId),
				);

				if (allPosts.size >= 2) await validateQuest(db, day, profile);
			};

			break;

		case 8:
			trigger = async () => {
				const candidates = await db
					.select()
					.from(attachments)
					.where(
						and(
							eq(attachments.authorId, profile),
							eq(attachments.type, "link"),
							eq(attachments.createdAt, new Date("2026-12-08")),
						),
					);

				const linksMap: Map<string, number> = candidates.reduce(
					(map, attachment) => {
						const postId = attachment.postId;

						if (!postId) {
							return map;
						}

						map.set(postId, (map.get(postId) || 0) + 1);
						return map;
					},
					new Map<string, number>(),
				);

				if (Array.from(linksMap.values()).some((v) => v >= 2))
					await validateQuest(db, day, profile);
			};

			break;

		case 10:
			trigger = async () => {
				const candidates = await db
					.select()
					.from(referrals)
					.innerJoin(
						referralCodes,
						eq(referrals.code, referralCodes.code),
					)
					.where(
						and(
							eq(referralCodes.authorId, profile),
							eq(referrals.confirmed, true),
							eq(referrals.createdAt, new Date("2026-12-15")),
						),
					);

				if (candidates.length >= 1)
					await validateQuest(db, day, profile);
			};

			break;

		case 11:
			trigger = async () => {
				const isRed = (color: string) => {
					let hex = color.replace("#", "");

					const r = parseInt(hex.substring(0, 2), 16);
					const g = parseInt(hex.substring(2, 4), 16);
					const b = parseInt(hex.substring(4, 6), 16);

					// Vérifie si la couleur est "rouge" en comparant les valeurs RGB
					return r > g && r > b;
				};

				const candidates = (
					await db
						.select()
						.from(whispers)
						.where(
							and(
								eq(whispers.profileId, profile),
								eq(whispers.createdAt, new Date("2026-12-11")),
								isNotNull(whispers.color),
							),
						)
				).filter((whisper) => isRed(whisper.color!));

				if (candidates.length >= 1)
					await validateQuest(db, day, profile);
			};

			break;

		// case 12 -> case 1

		case 17:
			trigger = async () => {
				const candidates = await db
					.select()
					.from(whispers)
					.where(
						and(
							eq(whispers.profileId, profile),
							eq(whispers.createdAt, new Date("2026-12-17")),
							isNotNull(whispers.color),
						),
					);

				const colors = new Set(
					candidates.map((whisper) => whisper.color),
				);

				if (colors.size >= 2) await validateQuest(db, day, profile);
			};

			break;

		case 18:
		case 24:
			trigger = async () => {
				const candidates = await db
					.select()
					.from(postReactions)
					.where(
						and(
							eq(postReactions.profileId, profile),
							eq(postReactions.createdAt, new Date(`2026-12-${day.toString().padStart(2, "0")}`)),
						),
					);

				if (candidates.length >= 5)
					await validateQuest(db, day, profile);
			};

			break;

		case 20:
			trigger = async () => {
				const identity = await requireAuth(event);

				if (!identity) {
					throw new Error("User not authenticated");
				}

				const candidates = await db
					.select()
					.from(posts)
					.where(
						and(
							eq(posts.profileId, profile),
							eq(posts.createdAt, new Date("2026-12-10")),
						),
					);

				const scores: Map<string, number> = (
					await retrieveSeveralCleanPosts(event, identity, candidates)
				).reduce((map, post) => {
					const score = calculateRatingScore(
						post.createdAt,
						post.content,
						1,
						post.stats,
						post.flags,
						{
							ethosMultiplier: true,
						},
					);

					return (map.set(post.id, score), map);
				}, new Map<string, number>());

				if (Array.from(scores.values()).some((score) => score >= 100))
					await validateQuest(db, day, profile);
			};

			break;

		default:
			// L'appel même de cette fonction témoigne de la complétion de la quête, pas de check nécessaire ici.
			trigger = async () => {
				// Pas de check nécessaire ici.

				if (
					new Date().toISOString().slice(0, 10) ===
					`2026-12-${day.toString().padStart(2, "0")}`
				)
					await validateQuest(db, day, profile);
			};

			break;
	}

	return await trigger();
}
