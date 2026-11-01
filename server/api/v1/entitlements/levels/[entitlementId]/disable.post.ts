import { useDb } from "~~/server/db";
import { levelsEntitlements } from "~~/server/db/schema/entitlements";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	await requireAuth(event, { min_level: 8 });

	const entitlementId = event.context.params?.entitlementId;

	if (!entitlementId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing entitlement ID",
		});
	}

	const [entitlement] = await db
		.select()
		.from(levelsEntitlements)
		.where(eq(levelsEntitlements.id, entitlementId))
		.limit(1);

	if (!entitlement) {
		throw createError({
			statusCode: 404,
			statusMessage: "Entitlement not found",
		});
	}

	if (entitlement.revoked) {
		throw createError({
			statusCode: 403,
			statusMessage: "Entitlement is revoked",
		});
	}

	if (!entitlement.enabled) {
		throw createError({
			statusCode: 204,
			statusMessage: "Entitlement is already disabled",
		});
	}

	const level = getLevelFromEntitlements(
		await db
			.select()
			.from(levelsEntitlements)
			.where(eq(levelsEntitlements.profileId, entitlement.profileId)),
	);

	await requireAuth(event, { min_level: level >= 8 ? 9 : 8 });

	await db
		.update(levelsEntitlements)
		.set({ enabled: false })
		.where(eq(levelsEntitlements.id, entitlementId));

	return {
		status: "ok",
	};
});
