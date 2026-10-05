import type { H3Event } from "h3";

import { createDb } from "#server/db";
import { eq } from "drizzle-orm";

import { referralCodes } from "~~/server/db/schema/referrals";

import { retrieveSeveralCleanReferralCodes } from "~~/server/utils/converters/referrals";

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const isAll = event.context.params?.all === "true";

		const offset = parseInt(event.context.params?.offset ?? "0", 10);
		const limit = parseInt(event.context.params?.limit ?? "50", 10);

		const identity = isAll
			? await requireAuth(event, { min_level: 6 })
			: await requireAuth(event);

		const result = isAll
			? await db.select().from(referralCodes).offset(offset).limit(limit)
			: await db
					.select()
					.from(referralCodes)
					.where(eq(referralCodes.authorId, identity.profileId))
					.offset(offset)
					.limit(limit);

		const cleanReferrals = await retrieveSeveralCleanReferralCodes(
			event,
			identity,
			result,
		);

		return {
			status: "ok",
			data: cleanReferrals,
		};
	} finally {
		await client.end();
	}
});
