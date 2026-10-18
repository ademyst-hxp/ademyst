import { useDb } from "#server/db";
import { referralCodes } from "~~/server/db/schema/referrals";
import { eq } from "drizzle-orm";

import { retrieveCleanReferralCode } from "~~/server/utils/converters/referrals";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const code = event.context.params?.code;

	if (!code) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing referral code ID",
		});
	}

	const identity = await requireAuth(event);

	const [result] = await db
		.select()
		.from(referralCodes)
		.where(eq(referralCodes.code, code));

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
});
