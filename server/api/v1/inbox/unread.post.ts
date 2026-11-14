import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const identity = await requireAuth(event);
	const payload = await readBody<{ after?: string }>(event);
	const after = payload?.after ? new Date(payload.after) : new Date();
	if (Number.isNaN(after.getTime())) throw createError({ statusCode: 400, statusMessage: "Invalid 'after' date format" });

	const updated = await useDb(event).update(notifications).set({ readAt: null }).where(and(
		eq(notifications.accountId, identity.accountId),
		or(isNull(notifications.profileId), eq(notifications.profileId, identity.profileId)),
		gt(notifications.createdAt, after),
	)).returning({ id: notifications.id });
	return { count: updated.length };
});
