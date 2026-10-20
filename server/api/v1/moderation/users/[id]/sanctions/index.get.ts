import { useDb } from "~~/server/db";
import { profiles } from "~~/server/db/schema/profiles";
import { sanctions } from "~~/server/db/schema/sanctions";
import { and, desc, eq, gt, isNotNull, isNull, lte, or } from "drizzle-orm";

import { retrieveSeveralCleanSanctions } from "~~/server/utils/converters/sanctions";
import { queryBoolean, queryEnum } from "~~/server/utils/helpers/filters";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";

import type { H3Event } from "h3";

const SANCTION_TYPES = ["ban", "mute", "shadow_ban", "warning"] as const;

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const id = event.context.params?.id;
	const normalizedId = normalizeId(id);

	if (!normalizedId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing user id",
		});
	}

	const identity = await requireAuth(event, {
		min_level: 6,
	});

	// Filters (all optional):
	//   type   = ban | mute | shadow_ban | warning
	//   active = true  -> sanctions that have no expiry date or have not expired yet
	//   active = false -> expired sanctions only
	const type = queryEnum(event, "type", SANCTION_TYPES);
	const active = queryBoolean(event, "active");

	const [target] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, normalizedId))
		.limit(1);

	if (!target) {
		throw createError({
			statusCode: 404,
			statusMessage: "User not found",
		});
	}

	const _sanctions = await db
		.select()
		.from(sanctions)
		.where(
			and(
				eq(sanctions.accountId, target.accountId),
				type ? eq(sanctions.type, type) : undefined,
				active === true
					? or(
							isNull(sanctions.expiresAt),
							gt(sanctions.expiresAt, new Date()),
						)
					: undefined,
				active === false
					? and(
							isNotNull(sanctions.expiresAt),
							lte(sanctions.expiresAt, new Date()),
						)
					: undefined,
			),
		)
		.orderBy(desc(sanctions.createdAt));

	if (!_sanctions.length) {
		return {
			status: "ok",
			data: [],
		};
	}

	return {
		status: "ok",
		data: await retrieveSeveralCleanSanctions(event, identity, _sanctions),
	};
});
