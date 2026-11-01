import { useDb } from "~~/server/db";
import { badgesEntitlements } from "~~/server/db/schema/entitlements";
import { and, desc, eq, gt, isNull, not, or } from "drizzle-orm";

import { queryPagination } from "~~/server/utils/helpers/filters";
import { retrieveSeveralCleanBadgeEntitlements } from "~~/server/utils/converters/entitlements";

const queryBoolean = (value: unknown, name: string) => {
	if (value === undefined || value === "") return undefined;

	if (value === "true") return true;
	if (value === "false") return false;

	throw createError({
		statusCode: 400,
		statusMessage: `Invalid ${name} parameter`,
	});
};

const queryString = (value: unknown) =>
	typeof value === "string" && value ? value : undefined;

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 8 });

	const { limit, offset } = queryPagination(event);

	const query = getQuery(event);

	const profileId = queryString(query.profileId);
	const badgeId = queryString(query.badgeId);
	const revoked = queryBoolean(query.revoked, "revoked");
	const enabled = queryBoolean(query.enabled, "enabled");
	const active = queryBoolean(query.active, "active");

	// Active: neither revoked nor disabled nor expired.
	const isActive = and(
		eq(badgesEntitlements.revoked, false),
		eq(badgesEntitlements.enabled, true),
		or(
			isNull(badgesEntitlements.expiresAt),
			gt(badgesEntitlements.expiresAt, new Date()),
		),
	);

	const entitlements = await db
		.select()
		.from(badgesEntitlements)
		.where(
			and(
				profileId
					? eq(badgesEntitlements.profileId, profileId)
					: undefined,
				badgeId ? eq(badgesEntitlements.badgeId, badgeId) : undefined,
				revoked !== undefined
					? eq(badgesEntitlements.revoked, revoked)
					: undefined,
				enabled !== undefined
					? eq(badgesEntitlements.enabled, enabled)
					: undefined,
				active === undefined
					? undefined
					: active
						? isActive
						: not(isActive!),
			),
		)
		.orderBy(desc(badgesEntitlements.createdAt), desc(badgesEntitlements.id))
		.limit(limit)
		.offset(offset);

	return {
		status: "ok",
		entitlements: await retrieveSeveralCleanBadgeEntitlements(
			event,
			identity,
			entitlements,
		),
		next: offset + limit,
		hasNext: entitlements.length === limit,
	};
});
