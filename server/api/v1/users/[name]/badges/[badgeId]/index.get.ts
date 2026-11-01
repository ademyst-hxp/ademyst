import { useDb } from "~~/server/db";
import { profiles } from "~~/server/db/schema/profiles";
import {
	badgesEntitlements,
	levelsEntitlements,
} from "~~/server/db/schema/entitlements";
import { eq } from "drizzle-orm";

import { retrieveCleanBadgeEntitlement } from "~~/server/utils/converters/entitlements";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const entitlementId = event.context.params?.entitlementId;
	const name = event.context.params?.name;

	if (!name) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing profile name",
		});
	}

	if (!entitlementId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing entitlement ID",
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

	const [entitlement] = await db
		.select()
		.from(badgesEntitlements)
		.where(eq(badgesEntitlements.id, entitlementId))
		.limit(1);

	if (!entitlement) {
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

	if (entitlement.profileId !== identity.profileId) {
		await requireAuth(event, { min_level: level >= 8 ? 9 : 8 });
	}

	return {
		status: "ok",
		entitlement: await retrieveCleanBadgeEntitlement(
			event,
			identity,
			entitlement,
		),
	};
});
