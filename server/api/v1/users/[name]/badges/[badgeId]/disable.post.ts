import { useDb } from "~~/server/db";
import { profiles } from "~~/server/db/schema/profiles";
import {
	badgesEntitlements,
	levelsEntitlements,
} from "~~/server/db/schema/entitlements";
import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const name = event.context.params?.name;
	const badgeId = event.context.params?.badgeId;

	if (!name) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing profile name",
		});
	}

	if (!badgeId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing badge ID",
		});
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.name, name))
		.limit(1);

	if (!profile) {
		throw createError({
			statusCode: 404,
			statusMessage: "Profile not found",
		});
	}

	const [candidate] = await db
		.select()
		.from(badgesEntitlements)
		.where(eq(badgesEntitlements.id, badgeId))
		.limit(1);

	if (!candidate) {
		throw createError({
			statusCode: 404,
			statusMessage: "Entitlement not found",
		});
	}

	const level = getLevelFromEntitlements(
		await db
			.select()
			.from(levelsEntitlements)
			.where(eq(levelsEntitlements.profileId, identity.profileId)),
	);

	if (candidate.profileId !== identity.profileId) {
		await requireAuth(event, { min_level: level >= 8 ? 9 : 8 });
	}

	if (candidate.revoked) {
		throw createError({
			statusCode: 403,
			statusMessage: "Entitlement is revoked",
		});
	}

	if (!candidate.enabled) {
		throw createError({
			statusCode: 204,
			statusMessage: "Entitlement is already disabled",
		});
	}

	await db
		.update(badgesEntitlements)
		.set({ enabled: false })
		.where(
			and(
				eq(badgesEntitlements.badgeId, badgeId),
				eq(badgesEntitlements.profileId, profile.id),
				eq(badgesEntitlements.enabled, true),
			),
		);

	const entitlements = await db
		.select()
		.from(badgesEntitlements)
		.where(eq(badgesEntitlements.profileId, identity.profileId));

	return {
		status: "ok",
		entitlements: await retrieveSeveralCleanBadgeEntitlements(
			event,
			identity,
			entitlements,
		),
	};
});
