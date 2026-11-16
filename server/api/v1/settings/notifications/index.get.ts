import { useDb } from "#server/db";
import { notificationSettings } from "#server/db/schema/settings";
import { eq } from "drizzle-orm";

import { requireAuth } from "~~/server/utils/middleware/auth";
import { convertNotificationSettings } from "~~/server/utils/converters/settings";

import { defaultNotificationSettings } from "#shared/models/settings";
import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	let [settings] = await db
		.select()
		.from(notificationSettings)
		.where(eq(notificationSettings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		// Valeurs par défaut de la base : tout désactivé (hors sécurité et
		// modération, qui n'ont pas de réglage).
		[settings] = await db
			.insert(notificationSettings)
			.values({ accountId: identity.accountId })
			.returning();
	}

	return {
		status: "ok",
		settings: settings
			? convertNotificationSettings(settings)
			: defaultNotificationSettings,
	};
});
