import type { H3Event } from "h3";
import { createDb } from "#server/db";
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
	const { db, client } = createDb();

	try {
		const identity = await getIdentity(event);

		if (!identity) {
			return {
				count: 0,
				critical: 0,
				endpoints,
			};
		}

		const [
			accountSanctionNotificationsCount,
			postSanctionNotificationsCount,
			reportNotificationsCount,
			postNotificationsCount,
			whisperNotificationsCount,
			followNotificationsCount,
		] = await Promise.all([
			db
				.select({ count: count() })
				.from(accountSanctionNotifications)
				.where(
					eq(
						accountSanctionNotifications.profileId,
						identity.profileId,
					),
				)
				.then((result) => result[0]?.count ?? 0),
			db
				.select({ count: count() })
				.from(postSanctionNotifications)
				.where(
					eq(postSanctionNotifications.profileId, identity.profileId),
				)
				.then((result) => result[0]?.count ?? 0),
			db
				.select({ count: count() })
				.from(reportNotifications)
				.where(eq(reportNotifications.profileId, identity.profileId))
				.then((result) => result[0]?.count ?? 0),
			db
				.select({ count: count() })
				.from(postNotifications)
				.where(eq(postNotifications.profileId, identity.profileId))
				.then((result) => result[0]?.count ?? 0),
			db
				.select({ count: count() })
				.from(whisperNotifications)
				.where(eq(whisperNotifications.profileId, identity.profileId))
				.then((result) => result[0]?.count ?? 0),
			db
				.select({ count: count() })
				.from(followNotifications)
				.where(eq(followNotifications.profileId, identity.profileId))
				.then((result) => result[0]?.count ?? 0),
		]);

		return {
			count:
				accountSanctionNotificationsCount +
				postSanctionNotificationsCount +
				reportNotificationsCount +
				postNotificationsCount +
				whisperNotificationsCount +
				followNotificationsCount,
			critical:
				accountSanctionNotificationsCount +
				postSanctionNotificationsCount +
				reportNotificationsCount,
			endpoints,
		};
	} finally {
		await client.end();
	}
});
