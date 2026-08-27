import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { badgesEntitlements } from "~~/server/db/schema/entitlements";

import { retrieveSeveralCleanBadgeEntitlements } from "~~/server/utils/converters/entitlements";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const entitlements = await db
		.select()
		.from(badgesEntitlements)
		.where(eq(badgesEntitlements.profileId, identity.profileId));

	return {
		status: "ok",
		entitlements: await retrieveSeveralCleanBadgeEntitlements(
			event,
			entitlements,
		),
	};
});
