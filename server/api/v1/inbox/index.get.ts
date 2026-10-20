import { useDb } from "#server/db";
import {
	accountSanctionNotifications,
	followNotifications,
	postNotifications,
	postSanctionNotifications,
	reportNotifications,
	whisperNotifications,
} from "#server/db/schema/inbox";
import { desc, eq } from "drizzle-orm";

import type { H3Event } from "h3";

const endpoints = {
	index: "/api/v1/inbox/",
	read: "/api/v1/inbox/read",
	unread: "/api/v1/inbox/unread",
};

const timeOf = (row: { createdAt: Date | string | number }) =>
	new Date(row.createdAt).getTime();

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);

	const query = getQuery(event);

	const limit = Math.min(Number(query.limit) || 100, 100);
	const offset = Math.max(Number(query.offset) || 0, 0);

	if (!identity) {
		return {
			notifications: [],
			next: offset,
			hasNext: false,
			endpoints,
		};
	}

	// The notifications live in six tables but are paginated as a single
	// list sorted by date. The page [offset, offset + limit[ of the merged
	// list is always contained in the first (offset + limit) rows of each
	// table, so each table is read up to that point (+1 to know whether
	// there is something after this page), then merged and sliced.
	const fetchSize = offset + limit + 1;

	const [
		accountSanctionNotificationsResult,
		postSanctionNotificationsResult,
		reportNotificationsResult,
		postNotificationsResult,
		whisperNotificationsResult,
		followNotificationsResult,
	] = await Promise.all([
		db
			.select()
			.from(accountSanctionNotifications)
			.where(
				eq(accountSanctionNotifications.profileId, identity.profileId),
			)
			.orderBy(
				desc(accountSanctionNotifications.createdAt),
				desc(accountSanctionNotifications.id),
			)
			.limit(fetchSize),
		db
			.select()
			.from(postSanctionNotifications)
			.where(eq(postSanctionNotifications.profileId, identity.profileId))
			.orderBy(
				desc(postSanctionNotifications.createdAt),
				desc(postSanctionNotifications.id),
			)
			.limit(fetchSize),
		db
			.select()
			.from(reportNotifications)
			.where(eq(reportNotifications.profileId, identity.profileId))
			.orderBy(
				desc(reportNotifications.createdAt),
				desc(reportNotifications.id),
			)
			.limit(fetchSize),
		db
			.select()
			.from(postNotifications)
			.where(eq(postNotifications.profileId, identity.profileId))
			.orderBy(
				desc(postNotifications.createdAt),
				desc(postNotifications.id),
			)
			.limit(fetchSize),
		db
			.select()
			.from(whisperNotifications)
			.where(eq(whisperNotifications.profileId, identity.profileId))
			.orderBy(
				desc(whisperNotifications.createdAt),
				desc(whisperNotifications.id),
			)
			.limit(fetchSize),
		db
			.select()
			.from(followNotifications)
			.where(eq(followNotifications.profileId, identity.profileId))
			.orderBy(
				desc(followNotifications.createdAt),
				desc(followNotifications.id),
			)
			.limit(fetchSize),
	]);

	const merged = [
		...accountSanctionNotificationsResult,
		...postSanctionNotificationsResult,
		...reportNotificationsResult,
		...postNotificationsResult,
		...whisperNotificationsResult,
		...followNotificationsResult,
	].sort((a, b) => timeOf(b) - timeOf(a));

	const page = merged.slice(offset, offset + limit);
	const selected = new Set<object>(page);

	const inPage = <T extends object>(rows: T[]) =>
		rows.filter((row) => selected.has(row));

	const notificationsObject = await retrieveCleanInboxNotifications(
		event,
		identity,
		{
			accountSanctions: inPage(accountSanctionNotificationsResult),
			postSanctions: inPage(postSanctionNotificationsResult),
			reports: inPage(reportNotificationsResult),
			posts: inPage(postNotificationsResult),
			whispers: inPage(whisperNotificationsResult),
			follows: inPage(followNotificationsResult),
		},
	);

	const notifications = [
		...notificationsObject.accountSanctions,
		...notificationsObject.postSanctions,
		...notificationsObject.reports,
		...notificationsObject.posts,
		...notificationsObject.whispers,
		...notificationsObject.follows,
	].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

	return {
		notifications,
		next: offset + page.length,
		hasNext: merged.length > offset + limit,
		endpoints,
	};
});
