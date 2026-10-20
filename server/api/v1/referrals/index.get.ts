import { useDb } from "#server/db";
import { referralCodes, referrals } from "~~/server/db/schema/referrals";
import { and, eq } from "drizzle-orm";

import { retrieveSeveralCleanReferrals } from "~~/server/utils/converters/referrals";
import { queryBoolean, queryPagination } from "~~/server/utils/helpers/filters";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	// These values were read from the route params, which never contain the
	// query string: ?all=true, ?limit and ?offset were silently ignored.
	const isAll = queryBoolean(event, "all") === true;
	const { limit, offset } = queryPagination(event, { defaultLimit: 50 });

	// Filter (optional): ?code=<referral code>
	const rawCode = getQuery(event).code;
	const code = typeof rawCode === "string" && rawCode ? rawCode : undefined;

	const identity = isAll
		? await requireAuth(event, { min_level: 6 })
		: await requireAuth(event);

	const result = isAll
		? await db
				.select()
				.from(referrals)
				.where(code ? eq(referrals.code, code) : undefined)
				.offset(offset)
				.limit(limit)
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
					.where(
						and(
							eq(referralCodes.authorId, identity.profileId),
							code ? eq(referrals.code, code) : undefined,
						),
					)
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
		next: offset + limit,
		hasNext: result.length === limit,
	};
});
