import { createDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { badgesEntitlements } from "~~/server/db/schema/entitlements";

import { retrieveSeveralCleanBadgeEntitlements } from "~~/server/utils/converters/entitlements";

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
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
	} finally {
		await client.end();
	}
});
