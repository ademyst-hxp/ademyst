import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { getNotificationCategory } from "~~/shared/consts/notifications";
import { NOTIFICATION_CATEGORIES } from "~~/shared/models/inbox";
import { and, eq, isNull, or } from "drizzle-orm";
import type { H3Event } from "h3";

const endpoints = { index: "/api/v1/inbox/", read: "/api/v1/inbox/read", unread: "/api/v1/inbox/unread" };

export default defineEventHandler(async (event: H3Event) => {
	const identity = await getIdentity(event);
	if (!identity) return { unread: 0, byCategory: {}, endpoints };
	const rows = await useDb(event).select({ type: notifications.type }).from(notifications).where(and(
		eq(notifications.accountId, identity.accountId),
		or(isNull(notifications.profileId), eq(notifications.profileId, identity.profileId)),
		isNull(notifications.readAt),
	));
	const byCategory = Object.fromEntries(
		NOTIFICATION_CATEGORIES.map((category) => [category, 0]),
	) as Record<(typeof NOTIFICATION_CATEGORIES)[number], number>;
	for (const row of rows) byCategory[getNotificationCategory(row.type)]++;
	return { unread: rows.length, byCategory, endpoints };
});
