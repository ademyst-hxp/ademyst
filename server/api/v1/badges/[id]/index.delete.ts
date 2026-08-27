import { eq } from "drizzle-orm/sql/expressions/conditions";

import { useDb } from "#server/db";
import { badges } from "~~/server/db/schema/shop";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const badgeId = event.context.params?.id;

	await requireAuth(event, {
		min_level: 8,
	});

	if (!badgeId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing badge ID",
		});
	}

	const [badge] = await db
		.select()
		.from(badges)
		.where(eq(badges.id, badgeId))
		.limit(1);

	if (!badge) {
		throw createError({
			statusCode: 404,
			statusMessage: "Badge not found",
		});
	}

	await db.delete(badges).where(eq(badges.id, badge.id));

	return {
		status: "ok",
	};
});
