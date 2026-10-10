import type { H3Event } from "h3";

import { useDb } from "~~/server/db";
import { eq, desc } from "drizzle-orm";

import { sanctions } from "~~/server/db/schema/sanctions";

import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";
import { profiles } from "~~/server/db/schema/profiles";
import { retrieveSeveralCleanSanctions } from "~~/server/utils/converters/sanctions";

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
		.where(eq(sanctions.accountId, target.accountId))
		.orderBy(desc(sanctions.createdAt));

	if (!_sanctions.length) {
		return {
			status: "ok",
			data: [],
		};
	}

	return {
		status: "ok",
		data: await retrieveSeveralCleanSanctions(
			event,
			identity,
			_sanctions,
		),
	};
});
