import { useDb } from "~~/server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { levelsEntitlements } from "~~/server/db/schema/entitlements";
import { levels } from "~~/server/db/schema/shop";
import { and, eq, isNotNull, lt } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 8 });

	const { profileId, levelId, name, reason, expiresAt } = ((await readBody(
		event,
	)) ?? {}) as {
		profileId?: string;
		levelId?: number;
		name?: string;
		reason?: string;
		expiresAt?: string | null;
	};

	if (!profileId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing profileId",
		});
	}

	if (!levelId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing levelId",
		});
	}

	// null/undefined: the level never expires.
	const expiration = expiresAt ? new Date(expiresAt) : null;

	if (expiration && Number.isNaN(expiration.getTime())) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid expiresAt",
		});
	}

	if (expiration && expiration.getTime() <= Date.now()) {
		throw createError({
			statusCode: 400,
			statusMessage: "expiresAt must be in the future",
		});
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	if (!profile) {
		throw createError({
			statusCode: 404,
			statusMessage: "Profile not found",
		});
	}

	const [lvl] = await db
		.select()
		.from(levels)
		.where(eq(levels.id, levelId))
		.limit(1);

	if (!lvl) {
		throw createError({
			statusCode: 404,
			statusMessage: "Level not found",
		});
	}

	const level = getLevelFromEntitlements(
		await db
			.select()
			.from(levelsEntitlements)
			.where(eq(levelsEntitlements.profileId, profile.id)),
	);

	await requireAuth(event, { min_level: level >= 8 ? 9 : 8 });

	const [candidate] = await db
		.insert(levelsEntitlements)
		.values({
			profileId: profile.id,
			levelId: lvl.id,
			name: name || "Moderator Assignment",
			reason: reason || "Assigned by moderator",
			expiresAt: expiration ?? undefined,
		})
		.returning();

	if (!candidate) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to assign level entitlement",
		});
	}

	// Revoke the entitlements of the same level that expire before this one
	// (a permanent entitlement never expires, so only a permanent one is kept
	// when the new entitlement is permanent too). Done after the insert so the
	// user can never end up without the level if it fails.
	const revoked = await db
		.update(levelsEntitlements)
		.set({ revoked: true })
		.where(
			and(
				eq(levelsEntitlements.profileId, profile.id),
				eq(levelsEntitlements.levelId, lvl.id),
				eq(levelsEntitlements.revoked, false),
				isNotNull(levelsEntitlements.expiresAt),
				expiration
					? lt(levelsEntitlements.expiresAt, expiration)
					: undefined,
			),
		)
		.returning({ id: levelsEntitlements.id });

	return {
		status: "ok",
		entitlement: await retrieveCleanLevelEntitlement(
			event,
			identity,
			candidate,
		),
		revoked: revoked.map((entry) => entry.id),
	};
});
