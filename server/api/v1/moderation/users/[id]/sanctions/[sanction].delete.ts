import { useDb } from "~~/server/db";
import { eq, and } from "drizzle-orm";

import { sanctions } from "~~/server/db/schema/sanctions";

import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeId } from "~~/server/utils/normalizers/ids";
import { profiles } from "~~/server/db/schema/profiles";
import { retrieveCleanSanction } from "~~/server/utils/converters/sanctions";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const id = event.context.params?.id;
	const sanctionId = event.context.params?.sanction;
	const normalizedId = normalizeId(id);
	const normalizedSanctionId = normalizeId(sanctionId);

	if (!normalizedId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing user id",
		});
	}

	if (!normalizedSanctionId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing sanction id",
		});
	}

	const identity = await requireAuth(event, {
		min_level: 8,
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

	const [sanction] = await db
		.select()
		.from(sanctions)
		.where(and(
			eq(sanctions.id, normalizedSanctionId),
			eq(sanctions.accountId, target.accountId)
		))
		.limit(1);

	if (!sanction) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to retrieve sanction",
		});
	}

	await db.delete(sanctions).where(eq(sanctions.id, sanction.id));

	return {
		status: "ok",
		data: await retrieveCleanSanction(event, identity, sanction),
	};
});
