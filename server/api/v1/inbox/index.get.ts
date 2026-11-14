import { useDb } from "#server/db";
import { notifications } from "#server/db/schema/inbox";
import { retrieveCleanNotifications } from "~~/server/utils/converters/inbox";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { queryBoolean, queryEnum, queryPagination } from "~~/server/utils/helpers/filters";
import type { H3Event } from "h3";

const TYPES = ["all", "content", "interactions", "relations", "rewards", "moderation", "security", "account", "announcements"] as const;
const CATEGORY_TYPES = {
	content: ["content.post", "content.whisper"],
	interactions: ["interaction.reaction", "interaction.milestone", "interaction.reply"],
	relations: ["relation.follower", "relation.request"],
	rewards: ["badge.granted", "badge.expired", "badge.revoked", "level.granted", "level.expired", "level.revoked"],
	moderation: ["report.received", "report.rejected", "report.actioned", "report.downgraded", "sanction.issued", "sanction.updated", "sanction.lifted", "sanction.expired"],
	security: ["security.email_changed", "security.email_confirmed", "security.password_changed", "security.deletion_requested"],
	account: ["account.settings_changed"],
	announcements: ["announcement.alert", "announcement.news"],
} as const;
const endpoints = { index: "/api/v1/inbox/", read: "/api/v1/inbox/read", unread: "/api/v1/inbox/unread" };

export default defineEventHandler(async (event: H3Event) => {
	const identity = await getIdentity(event);
	const { limit, offset } = queryPagination(event);
	const type = queryEnum(event, "type", TYPES) ?? "all";
	const unreadOnly = queryBoolean(event, "unread") === true;

	if (!identity) return { notifications: [], next: offset, hasNext: false, endpoints };

	const db = useDb(event);
	const rows = await db.select().from(notifications).where(and(
		eq(notifications.accountId, identity.accountId),
		or(isNull(notifications.profileId), eq(notifications.profileId, identity.profileId)),
		unreadOnly ? isNull(notifications.readAt) : undefined,
		type !== "all" ? inArray(notifications.type, CATEGORY_TYPES[type]) : undefined,
	)).orderBy(desc(notifications.createdAt), desc(notifications.id)).limit(offset + limit + 1);

	const page = rows.slice(offset, offset + limit);
	return {
		notifications: await retrieveCleanNotifications(event, identity, page),
		next: offset + page.length,
		hasNext: rows.length > offset + limit,
		endpoints,
	};
});
