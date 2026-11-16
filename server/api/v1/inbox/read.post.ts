import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { and, eq, isNull, or } from "drizzle-orm";
import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const identity = await requireAuth(event);
	await useDb(event).update(notifications).set({ readAt: new Date() }).where(and(
		eq(notifications.accountId, identity.accountId),
		or(isNull(notifications.profileId), eq(notifications.profileId, identity.profileId)),
		isNull(notifications.readAt),
	));
	return { status: "ok" };
});
