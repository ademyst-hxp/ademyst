import { useDb } from "~~/server/db";
import { badgesEntitlements } from "~~/server/db/schema/entitlements";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 8 });

	const entitlementId = event.context.params?.entitlementId;

	if (!entitlementId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing entitlement ID",
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

	return {
		status: "ok",
		entitlement: await retrieveCleanBadgeEntitlement(
			event,
			identity,
			entitlement,
		),
	};
});
