import type { H3Event } from "h3";

import { createDb } from "#server/db";
import { eq } from "drizzle-orm";

import { referralCodes } from "~~/server/db/schema/referrals";

import { retrieveCleanReferralCode } from "~~/server/utils/converters/referrals";

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const id = event.context.params?.id;

		if (!id) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing referral code ID",
			});
		}

		const identity = await requireAuth(event);

		const [result] = await db
			.select()
			.from(referralCodes)
			.where(eq(referralCodes.id, id));

		if (!result) {
			throw createError({
				statusCode: 404,
				statusMessage: "Referral code not found",
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
