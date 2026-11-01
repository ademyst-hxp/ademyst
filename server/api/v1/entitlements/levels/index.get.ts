import { useDb } from "~~/server/db";
import { levelsEntitlements } from "~~/server/db/schema/entitlements";
import { and, desc, eq, gt, isNull, not, or } from "drizzle-orm";

import { queryPagination } from "~~/server/utils/helpers/filters";
import { retrieveSeveralCleanLevelEntitlements } from "~~/server/utils/converters/entitlements";

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

const queryInteger = (value: unknown) => {
	if (value === undefined || value === "") return undefined;

	const parsed = parseInt(value as string, 10);

	if (isNaN(parsed)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid integer parameter",
		});
	}

	return parsed;
};

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 8 });

	const { limit, offset } = queryPagination(event);

	const query = getQuery(event);

	const profileId = queryString(query.profileId);
	const levelId = queryInteger(query.levelId);
	const revoked = queryBoolean(query.revoked, "revoked");
	const enabled = queryBoolean(query.enabled, "enabled");
	const active = queryBoolean(query.active, "active");

	// Active: neither revoked nor disabled nor expired.
	const isActive = and(
		eq(levelsEntitlements.revoked, false),
		eq(levelsEntitlements.enabled, true),
		or(
			isNull(levelsEntitlements.expiresAt),
			gt(levelsEntitlements.expiresAt, new Date()),
		),
	);

	const entitlements = await db
		.select()
		.from(levelsEntitlements)
		.where(
			and(
				profileId
					? eq(levelsEntitlements.profileId, profileId)
					: undefined,
				levelId ? eq(levelsEntitlements.levelId, levelId) : undefined,
				revoked !== undefined
					? eq(levelsEntitlements.revoked, revoked)
					: undefined,
				enabled !== undefined
					? eq(levelsEntitlements.enabled, enabled)
					: undefined,
				active === undefined
					? undefined
					: active
						? isActive
						: not(isActive!),
			),
		)
		.orderBy(
			desc(levelsEntitlements.createdAt),
			desc(levelsEntitlements.id),
		)
		.limit(limit)
		.offset(offset);

	return {
		status: "ok",
		entitlements: await retrieveSeveralCleanLevelEntitlements(
			event,
			identity,
			entitlements,
		),
		next: offset + limit,
		hasNext: entitlements.length === limit,
	};
});
