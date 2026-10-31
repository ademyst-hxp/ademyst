import { useDb } from "~~/server/db";
import { profiles } from "~~/server/db/schema/profiles";
import {
	levelsEntitlements,
	badgesEntitlements,
} from "~~/server/db/schema/entitlements";
import { and, eq, gt, inArray } from "drizzle-orm";

import { levels } from "~~/server/db/schema/shop";

import { getLevelInfo } from "~~/shared/consts/labels";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const levelId = event.context.params?.level;
	const profileId = getQuery(event).profileId as string | undefined;

	const { name, reason, expiresAt } = (await readBody(event)) as {
		name: string;
		reason: string;
		expiresAt?: string;
	};

	const identity = await requireAuth(event, { min_level: 8 });
	const author = await getUser(event, identity);

	if (!author) {
		throw createError({
			statusCode: 403,
			statusMessage: "Unauthorized",
		});
	}

	if (!levelId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing level parameter",
		});
	}

	const [level] = await db
		.select()
		.from(levels)
		.where(eq(levels.id, Number(levelId)));

	if (!level) {
		throw createError({
			statusCode: 404,
			statusMessage: "Level not found",
		});
	}

	if (!profileId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing profileId parameter",
		});
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, profileId));

	if (!profile) {
		throw createError({
			statusCode: 404,
			statusMessage: "Profile not found",
		});
	}

	const targetLevel = getLevelFromEntitlements(
		await db
			.select()
			.from(levelsEntitlements)
			.where(
				and(
					eq(levelsEntitlements.profileId, profile.id),
					eq(levelsEntitlements.enabled, true),
				),
			),
	);

	if (targetLevel >= author.profile.level) {
		throw createError({
			statusCode: 403,
			statusMessage: "Cannot modify team members with level 8 or higher",
		});
	}

	await db
		.delete(levelsEntitlements)
		.where(
			and(
				gt(levelsEntitlements.levelId, 5),
				eq(levelsEntitlements.profileId, profileId),
			),
		);

	await db.delete(badgesEntitlements).where(
		and(
			eq(badgesEntitlements.profileId, profileId),
			inArray(
				badgesEntitlements.badgeId,
				[6, 7, 8, 9]
					.map((id) => {
						return getLevelInfo(id).badge || null;
					})
					.filter((v) => !!v),
			),
		),
	);

	const [candidate] = await db
		.insert(levelsEntitlements)
		.values({
			profileId,
			levelId: Number(level.id),
			name: name || "Moderator Assignment",
			reason: reason || "Assigned by moderator",
			expiresAt: expiresAt ? new Date(expiresAt) : undefined,
		})
		.returning();

	if (!candidate) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to assign level entitlement",
		});
	}

	const badgeId = getLevelInfo(Number(level.id)).badge;

	if (badgeId) {
		await db
			.insert(badgesEntitlements)
			.values({
				profileId,
				badgeId,
				name: name || "Moderator Assignment",
				reason: reason || "Assigned by moderator",
				expiresAt: expiresAt ? new Date(expiresAt) : undefined,
			});
	}

	const entitlement = await retrieveCleanLevelEntitlement(
		event,
		identity,
		candidate,
		{ profile },
	);

	return {
		status: "ok",
		entitlement,
	};
});
