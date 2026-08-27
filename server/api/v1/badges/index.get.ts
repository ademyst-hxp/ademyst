import { useDb } from "~~/server/db";

import { badges } from "~~/server/db/schema/shop";

import { retrieveSeveralCleanBadges } from "~~/server/utils/converters/shop";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const badgesList = await db.select().from(badges);

	return {
		status: "ok",
		badges: await retrieveSeveralCleanBadges(event, badgesList),
	};
});
