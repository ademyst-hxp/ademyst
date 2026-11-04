import { useDb } from "~~/server/db";
import { profiles } from "~~/server/db/schema/profiles";
import {
	badgesEntitlements,
	levelsEntitlements,
} from "~~/server/db/schema/entitlements";
import { badges } from "~~/server/db/schema/shop";
import { and, eq, isNotNull, lt } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 8 });

	const { profileId, badgeId, name, reason, expiresAt } = ((await readBody(
		event,
	)) ?? {}) as {
		profileId?: string;
		badgeId?: string;
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

	if (!badgeId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing badgeId",
		});
	}

	// null/undefined: the badge never expires.
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

	const [badge] = await db
		.select()
		.from(badges)
		.where(eq(badges.id, badgeId))
		.limit(1);

	if (!badge) {
		throw createError({
			statusCode: 404,
			statusMessage: "Badge not found",
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
		.insert(badgesEntitlements)
		.values({
			profileId: profile.id,
			badgeId: badge.id,
			name: name || "Moderator Assignment",
			reason: reason || "Assigned by moderator",
			expiresAt: expiration ?? undefined,
		})
		.returning();

	if (!candidate) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to assign badge entitlement",
		});
	}

	// Revoke the entitlements of the same badge that expire before this one
	// (a permanent entitlement never expires, so only a permanent one is kept
	// when the new entitlement is permanent too). Done after the insert so the
	// user can never end up without the badge if it fails.
	const revoked = await db
		.update(badgesEntitlements)
		.set({ revoked: true })
		.where(
			and(
				eq(badgesEntitlements.profileId, profile.id),
				eq(badgesEntitlements.badgeId, badge.id),
				eq(badgesEntitlements.revoked, false),
				isNotNull(badgesEntitlements.expiresAt),
				expiration
					? lt(badgesEntitlements.expiresAt, expiration)
					: undefined,
			),
		)
		.returning({ id: badgesEntitlements.id });

	return {
		status: "ok",
		entitlement: await retrieveCleanBadgeEntitlement(
			event,
			identity,
			candidate,
		),
		revoked: revoked.map((entry) => entry.id),
	};
});
