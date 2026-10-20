import { useDb } from "#server/db";
import {
	accountSanctionNotifications,
	followNotifications,
	postNotifications,
	postSanctionNotifications,
	reportNotifications,
	whisperNotifications,
} from "#server/db/schema/inbox";
import { and, desc, eq } from "drizzle-orm";

import {
	queryBoolean,
	queryEnum,
	queryPagination,
} from "~~/server/utils/helpers/filters";

import type { H3Event } from "h3";

const endpoints = {
	index: "/api/v1/inbox/",
	read: "/api/v1/inbox/read",
	unread: "/api/v1/inbox/unread",
};

// ?type=... matches the tabs of the inbox page.
const TYPES = [
	"all",
	"interactions",
	"relations",
	"sanctions",
	"reports",
] as const;

const timeOf = (row: { createdAt: Date | string | number }) =>
	new Date(row.createdAt).getTime();

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);

	const { limit, offset } = queryPagination(event);

	// Filters (all optional):
	//   type   = all | interactions | relations | sanctions | reports
	//   unread = true  -> only the notifications not read yet
	const type = queryEnum(event, "type", TYPES) ?? "all";
	const unreadOnly = queryBoolean(event, "unread") === true;

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

	// A table that does not belong to the requested type is not read at all.
	const wants = (...types: (typeof TYPES)[number][]) =>
		type === "all" || types.includes(type);

	const [
		accountSanctionNotificationsResult,
		postSanctionNotificationsResult,
		reportNotificationsResult,
		postNotificationsResult,
		whisperNotificationsResult,
		followNotificationsResult,
	] = await Promise.all([
		wants("sanctions")
			? db
					.select()
					.from(accountSanctionNotifications)
					.where(
						and(
							eq(
								accountSanctionNotifications.profileId,
								identity.profileId,
							),
							unreadOnly
								? eq(accountSanctionNotifications.read, false)
								: undefined,
						),
					)
					.orderBy(
						desc(accountSanctionNotifications.createdAt),
						desc(accountSanctionNotifications.id),
					)
					.limit(fetchSize)
			: Promise.resolve([]),
		wants("sanctions")
			? db
					.select()
					.from(postSanctionNotifications)
					.where(
						and(
							eq(
								postSanctionNotifications.profileId,
								identity.profileId,
							),
							unreadOnly
								? eq(postSanctionNotifications.read, false)
								: undefined,
						),
					)
					.orderBy(
						desc(postSanctionNotifications.createdAt),
						desc(postSanctionNotifications.id),
					)
					.limit(fetchSize)
			: Promise.resolve([]),
		wants("reports")
			? db
					.select()
					.from(reportNotifications)
					.where(
						and(
							eq(
								reportNotifications.profileId,
								identity.profileId,
							),
							unreadOnly
								? eq(reportNotifications.read, false)
								: undefined,
						),
					)
					.orderBy(
						desc(reportNotifications.createdAt),
						desc(reportNotifications.id),
					)
					.limit(fetchSize)
			: Promise.resolve([]),
		wants("interactions")
			? db
					.select()
					.from(postNotifications)
					.where(
						and(
							eq(postNotifications.profileId, identity.profileId),
							unreadOnly
								? eq(postNotifications.read, false)
								: undefined,
						),
					)
					.orderBy(
						desc(postNotifications.createdAt),
						desc(postNotifications.id),
					)
					.limit(fetchSize)
			: Promise.resolve([]),
		wants("interactions")
			? db
					.select()
					.from(whisperNotifications)
					.where(
						and(
							eq(
								whisperNotifications.profileId,
								identity.profileId,
							),
							unreadOnly
								? eq(whisperNotifications.read, false)
								: undefined,
						),
					)
					.orderBy(
						desc(whisperNotifications.createdAt),
						desc(whisperNotifications.id),
					)
					.limit(fetchSize)
			: Promise.resolve([]),
		wants("relations")
			? db
					.select()
					.from(followNotifications)
					.where(
						and(
							eq(
								followNotifications.profileId,
								identity.profileId,
							),
							unreadOnly
								? eq(followNotifications.read, false)
								: undefined,
						),
					)
					.orderBy(
						desc(followNotifications.createdAt),
						desc(followNotifications.id),
					)
					.limit(fetchSize)
			: Promise.resolve([]),
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
