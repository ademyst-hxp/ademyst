import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { badgesEntitlements } from "~~/server/db/schema/entitlements";

import { retrieveCleanBadgeEntitlement } from "~~/server/utils/converters/entitlements";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

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

	if (entitlement.profileId !== identity.profileId) {
		throw createError({
			statusCode: 403,
			statusMessage:
				"You are not authorized to delete this entitlement",
		});
	}

	if (entitlement.revoked) {
		throw createError({
			statusCode: 204,
			statusMessage: "Entitlement is already revoked",
		});
	}

	await db
		.update(badgesEntitlements)
		.set({ revoked: true })
		.where(eq(badgesEntitlements.id, entitlementId));

	return {
		status: "ok",
	};
});
