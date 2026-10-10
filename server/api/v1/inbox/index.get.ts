import type { H3Event } from "h3";
import { useDb } from "#server/db";
import { eq, count } from "drizzle-orm";

import {
	accountSanctionNotifications,
	postSanctionNotifications,
	reportNotifications,
	postNotifications,
	whisperNotifications,
	followNotifications,
} from "#server/db/schema/inbox";

const endpoints = {
	index: "/api/v1/inbox/",
	read: "/api/v1/inbox/read",
	unread: "/api/v1/inbox/unread",
};

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);

	if (!identity) {
		return {
			notifications: [],
			endpoints,
		};
	}

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
				eq(
					accountSanctionNotifications.profileId,
					identity.profileId,
				),
			),
		db
			.select()
			.from(postSanctionNotifications)
			.where(
				eq(postSanctionNotifications.profileId, identity.profileId),
			),
		db
			.select()
			.from(reportNotifications)
			.where(eq(reportNotifications.profileId, identity.profileId)),
		db
			.select()
			.from(postNotifications)
			.where(eq(postNotifications.profileId, identity.profileId)),
		db
			.select()
			.from(whisperNotifications)
			.where(eq(whisperNotifications.profileId, identity.profileId)),
		db
			.select()
			.from(followNotifications)
			.where(eq(followNotifications.profileId, identity.profileId)),
	]);

	const notificationsObject = await retrieveCleanInboxNotifications(
		event,
		identity,
		{
			accountSanctions: accountSanctionNotificationsResult,
			postSanctions: postSanctionNotificationsResult,
			reports: reportNotificationsResult,
			posts: postNotificationsResult,
			whispers: whisperNotificationsResult,
			follows: followNotificationsResult,
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
		endpoints,
	};
});
