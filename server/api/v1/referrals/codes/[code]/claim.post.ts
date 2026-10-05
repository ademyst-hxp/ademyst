import type { H3Event } from "h3";

import { createDb } from "#server/db";
import { eq } from "drizzle-orm";

import { referralCodes, referrals } from "~~/server/db/schema/referrals";

import { retrieveCleanReferralCode } from "~~/server/utils/converters/referrals";

import { giveReferralBadge } from "~~/server/jobs/signup";

function normalizeCode(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const code = value.trim().toUpperCase();
	if (!code || !/^[A-Fa-f0-9]{6,10}$/u.test(code)) return null;

	return code;
}

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const code = normalizeCode(event.context.params?.code);

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

		if (!result.enabled) {
			throw createError({
				statusCode: 403,
				statusMessage: "Referral code is disabled",
			});
		}

		await db.insert(referrals).values({
			code: result.code,
			referredId: identity.profileId,
		});

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
