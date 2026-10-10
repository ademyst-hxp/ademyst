import type { H3Event } from "h3";
import { useDb } from "#server/db";
import { and, eq, gt, count } from "drizzle-orm";

import {
	accountSanctionNotifications,
	postSanctionNotifications,
	reportNotifications,
	postNotifications,
	whisperNotifications,
	followNotifications,
} from "#server/db/schema/inbox";

const validatePayload = (payload: any): { after?: Date } => {
	if (typeof payload !== "object" || payload === null) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	if ("after" in payload && typeof payload.after !== "string") {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid 'after' value",
		});
	}

	if ("after" in payload && isNaN(Date.parse(payload.after))) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid 'after' date format",
		});
	}

	return {
		after: new Date(payload.after),
	};
};

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const payload = await readBody(event);
	const { after } = validatePayload(payload);

	const [
		accountSanctionNotificationsCount,
		postSanctionNotificationsCount,
		reportNotificationsCount,
		postNotificationsCount,
		whisperNotificationsCount,
		followNotificationsCount,
	] = await Promise.all([
		db
			.update(accountSanctionNotifications)
			.set({ read: false })
			.where(
				and(
					eq(
						accountSanctionNotifications.profileId,
						identity.profileId,
					),
					gt(
						accountSanctionNotifications.createdAt,
						after ?? new Date(),
					),
				),
			)
			.returning({ count: count() })
			.then((result) => result[0]?.count ?? 0),
		db
			.update(postSanctionNotifications)
			.set({ read: false })
			.where(
				and(
					eq(
						postSanctionNotifications.profileId,
						identity.profileId,
					),
					gt(
						postSanctionNotifications.createdAt,
						after ?? new Date(),
					),
				),
			)
			.returning({ count: count() })
			.then((result) => result[0]?.count ?? 0),
		db
			.update(reportNotifications)
			.set({ read: false })
			.where(
				and(
					eq(reportNotifications.profileId, identity.profileId),
					gt(reportNotifications.createdAt, after ?? new Date()),
				),
			)
			.returning({ count: count() })
			.then((result) => result[0]?.count ?? 0),
		db
			.update(postNotifications)
			.set({ read: false })
			.where(
				and(
					eq(postNotifications.profileId, identity.profileId),
					gt(postNotifications.createdAt, after ?? new Date()),
				),
			)
			.returning({ count: count() })
			.then((result) => result[0]?.count ?? 0),
		db
			.update(whisperNotifications)
			.set({ read: false })
			.where(
				and(
					eq(whisperNotifications.profileId, identity.profileId),
					gt(whisperNotifications.createdAt, after ?? new Date()),
				),
			)
			.returning({ count: count() })
			.then((result) => result[0]?.count ?? 0),
		db
			.update(followNotifications)
			.set({ read: false })
			.where(
				and(
					eq(followNotifications.profileId, identity.profileId),
					gt(followNotifications.createdAt, after ?? new Date()),
				),
			)
			.returning({ count: count() })
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
	};
});
