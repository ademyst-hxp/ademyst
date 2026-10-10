import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { badges } from "~~/server/db/schema/shop";

import { retrieveCleanBadge } from "~~/server/utils/converters/shop";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const badgeId = event.context.params?.id;

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

	return {
		status: "ok",
		badge: await retrieveCleanBadge(event, badge),
	};
});
