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

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const identity = await requireAuth(event);

		await Promise.all([
			db
				.update(accountSanctionNotifications)
				.set({ read: true })
				.where(
					eq(
						accountSanctionNotifications.profileId,
						identity.profileId,
					),
				),
			db
				.update(postSanctionNotifications)
				.set({ read: true })
				.where(
					eq(postSanctionNotifications.profileId, identity.profileId),
				),
			db
				.update(reportNotifications)
				.set({ read: true })
				.where(eq(reportNotifications.profileId, identity.profileId)),
			db
				.update(postNotifications)
				.set({ read: true })
				.where(eq(postNotifications.profileId, identity.profileId)),
			db
				.update(whisperNotifications)
				.set({ read: true })
				.where(eq(whisperNotifications.profileId, identity.profileId)),
			db
				.update(followNotifications)
				.set({ read: true })
				.where(eq(followNotifications.profileId, identity.profileId)),
		]);

		return {
			status: "ok",
		};
	} finally {
		await client.end();
	}
});
