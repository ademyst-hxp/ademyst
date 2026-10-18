import { useDb } from "#server/db";
import { profiles } from "#server/db/schema/profiles";
import { follows } from "~~/server/db/schema/relations";
import { desc, eq, inArray } from "drizzle-orm";

import { retrieveSeveralCleanProfiles } from "#server/utils/converters/profiles";
import { requireAuth } from "#server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const query = getQuery(event);

	const limit = Math.min(Number(query.limit) || 100, 100);
	const offset = Math.max(Number(query.offset) || 0, 0);

	const following = await db
		.select()
		.from(follows)
		.where(eq(follows.followerId, identity.profileId))
		.offset(offset)
		.limit(limit);

	const rawProfiles = (
		await db
			.select({
				profiles,
			})
			.from(follows)
			.innerJoin(profiles, eq(follows.followingId, profiles.id))
			.where(
				inArray(
					follows.followerId,
					following.map((f) => f.followingId),
				),
			)
			.orderBy(desc(profiles.createdAt))
			.offset(offset)
			.limit(limit)
	).map((row) => row.profiles);

	const resolvedProfiles = await retrieveSeveralCleanProfiles(
		event,
		identity,
		rawProfiles,
	);

	const uniqueProfiles = resolvedProfiles.filter(
		(profile, index, self) =>
			index === self.findIndex((p) => p.id === profile.id),
	);

	return {
		status: "ok",
		users: uniqueProfiles,
		next: offset + limit,
		hasNext: uniqueProfiles.length === limit,
	};
});
