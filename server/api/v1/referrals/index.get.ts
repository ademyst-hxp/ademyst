import type { H3Event } from "h3";

import { eq, and } from "drizzle-orm";

import { createDb } from "#server/db";

import { referralCodes, referrals } from "~~/server/db/schema/referrals";

import { retrieveSeveralCleanReferrals } from "~~/server/utils/converters/referrals";

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
			? await db.select().from(referrals).offset(offset).limit(limit)
			: (
					await db
						.select({
							referral: referrals,
						})
						.from(referrals)
						.innerJoin(
							referralCodes,
							eq(referrals.code, referralCodes.code),
						)
						.where(eq(referralCodes.authorId, identity.profileId))
						.offset(offset)
						.limit(limit)
				).map((row) => row.referral);

		const cleanReferrals = await retrieveSeveralCleanReferrals(
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
