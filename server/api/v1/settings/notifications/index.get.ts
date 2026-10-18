import { useDb } from "#server/db";
import { notificationSettings } from "#server/db/schema/settings";
import { eq } from "drizzle-orm";

import { requireAuth } from "~~/server/utils/middleware/auth";

import type { NotificationSettings } from "#shared/models/settings";
import type { H3Event } from "h3";

function generateDefaultNotificationSettings(): NotificationSettings {
	return {
		securityAlertsEmail: true,
		moderationAlertsEmail: true,
		broadcastsEmail: false,
		socialEmail: false,
		interactionsEmail: false,
		campaignEmail: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const [settings] = await db
		.select()
		.from(notificationSettings)
		.where(eq(notificationSettings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		const defaultSettings =
			generateDefaultNotificationSettings() as NotificationSettings

		await db.insert(notificationSettings).values({
			...defaultSettings,
			accountId: identity.accountId,
		});

		return {
			status: "ok",
			settings: defaultSettings,
		};
	}

	return {
		status: "ok",
		settings,
	};
});
