import { useDb } from "#server/db";
import { referralCodes } from "~~/server/db/schema/referrals";
import { and, eq } from "drizzle-orm";

import { retrieveSeveralCleanReferralCodes } from "~~/server/utils/converters/referrals";
import { queryBoolean, queryPagination } from "~~/server/utils/helpers/filters";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	// These values were read from the route params, which never contain the
	// query string: ?all=true, ?limit and ?offset were silently ignored.
	const isAll = queryBoolean(event, "all") === true;
	const { limit, offset } = queryPagination(event, { defaultLimit: 50 });

	// Filter (optional): ?enabled=true|false
	const enabled = queryBoolean(event, "enabled");

	const identity = isAll
		? await requireAuth(event, { min_level: 6 })
		: await requireAuth(event);

	const result = await db
		.select()
		.from(referralCodes)
		.where(
			and(
				isAll
					? undefined
					: eq(referralCodes.authorId, identity.profileId),
				enabled === undefined
					? undefined
					: eq(referralCodes.enabled, enabled),
			),
		)
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
		next: offset + limit,
		hasNext: result.length === limit,
	};
});
