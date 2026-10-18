import { useDb } from "#server/db";
import { referrals } from "~~/server/db/schema/referrals";
import { eq } from "drizzle-orm";

import { retrieveCleanReferral } from "~~/server/utils/converters/referrals";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const [result] = await db
		.select()
		.from(referrals)
		.where(eq(referrals.referredId, identity.profileId))
		.limit(1);

	if (!result) {
		return {
			status: "ok",
			data: null,
		};
	}

	const cleanReferral = await retrieveCleanReferral(
		event,
		identity,
		result,
	);

	return {
		status: "ok",
		data: cleanReferral,
	};
});
