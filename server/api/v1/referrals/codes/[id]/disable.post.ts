import type { H3Event } from "h3";

import { createDb } from "#server/db";
import { eq } from "drizzle-orm";

import { referralCodes, referrals } from "~~/server/db/schema/referrals";

import { retrieveCleanReferralCode } from "~~/server/utils/converters/referrals";

import { giveReferralBadge } from "~~/server/jobs/signup";

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

		const [candidate] = await db
			.select()
			.from(referralCodes)
			.where(eq(referralCodes.id, id));

		if (!candidate) {
			throw createError({
				statusCode: 404,
				statusMessage: "Referral code not found",
			});
		}

		if (candidate.authorId === identity.profileId) {
			await requireAuth(event, { min_level: 6 });
		}

		const [result] = await db
			.update(referralCodes)
			.set({ enabled: false })
			.where(eq(referralCodes.id, id))
			.returning();

		if (!result) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to disable referral code",
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
