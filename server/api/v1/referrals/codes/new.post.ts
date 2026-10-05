import type { H3Event } from "h3";

import { createDb } from "#server/db";

import { referralCodes } from "~~/server/db/schema/referrals";

import { retrieveCleanReferralCode } from "~~/server/utils/converters/referrals";

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const identity = await requireAuth(event);

		const code = generateHexId();

		const [result] = await db
			.insert(referralCodes)
			.values({
				authorId: identity.profileId,
				code,
			})
			.returning();

		if (!result) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to create referral code",
			});
		}

		const cleanReferral = await retrieveCleanReferralCode(
			event,
			identity,
			result,
		);

		return {
			status: "ok",
			data: cleanReferral,
		};
	} finally {
		await client.end();
	}
});
