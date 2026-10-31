import { useDb } from "~~/server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { levelsEntitlements } from "~~/server/db/schema/entitlements";
import { desc, eq } from "drizzle-orm";

import { queryPagination } from "~~/server/utils/helpers/filters";
import { retrieveSeveralCleanLevelEntitlements } from "~~/server/utils/converters/entitlements";

export default defineEventHandler(async (event) => {
	const db = useDb(event);
	const level = event.context.params?.level;

	if (!level) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing level parameter",
		});
	}

	const identity = await requireAuth(event, { min_level: 8 });

	const { limit, offset } = queryPagination(event);

	const _candidates = await db
		.select()
		.from(levelsEntitlements)
		.where(eq(levelsEntitlements.levelId, Number(level)))
		.innerJoin(profiles, eq(levelsEntitlements.profileId, profiles.id))
		.orderBy(desc(levelsEntitlements.createdAt))
		.limit(limit)
		.offset(offset);

	return {
		status: "ok",
		memberships: await retrieveSeveralCleanLevelEntitlements(
			event,
			identity,
			_candidates.map((c) => c.levels_entitlements),
			{
				profiles: _candidates.map((c) => c.profiles),
			},
		),
		next: offset + limit,
		hasNext: _candidates.length === limit,
	};
});
