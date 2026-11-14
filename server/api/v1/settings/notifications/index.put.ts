import { useDb } from "#server/db";
import { notificationSettings } from "#server/db/schema/settings";
import { eq } from "drizzle-orm";

import { NOTIFICATION_EMAIL_SETTINGS } from "~~/shared/consts/notifications";
import { convertNotificationSettings } from "~~/server/utils/converters/settings";
import { requireAuth } from "~~/server/utils/middleware/auth";

import type { NotificationEmailSetting } from "#shared/models/settings";
import type { H3Event } from "h3";

type UpdateNotificationSettingsRequest = Partial<
	Record<NotificationEmailSetting, boolean>
>;

// Ne garde que les réglages connus. Les notifications de sécurité et de
// modération n'en ont pas : elles sont toujours envoyées par mail, une clé
// inconnue est donc refusée plutôt qu'ignorée en silence.
function normalizeNotificationSettings(
	body: unknown,
): UpdateNotificationSettingsRequest {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid notification settings",
		});
	}

	const known = new Set<string>(NOTIFICATION_EMAIL_SETTINGS);
	const normalized: UpdateNotificationSettingsRequest = {};

	for (const [key, value] of Object.entries(body)) {
		if (!known.has(key)) {
			throw createError({
				statusCode: 400,
				statusMessage: `Unknown notification setting: ${key}`,
			});
		}

		if (typeof value !== "boolean") {
			throw createError({
				statusCode: 400,
				statusMessage: `Invalid value for notification setting: ${key}`,
			});
		}

		normalized[key as NotificationEmailSetting] = value;
	}

	return normalized;
}

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const changes = normalizeNotificationSettings(
		await readBody<unknown>(event),
	);

	const [existing] = await db
		.select({ id: notificationSettings.id })
		.from(notificationSettings)
		.where(eq(notificationSettings.accountId, identity.accountId))
		.limit(1);

	const [settings] = existing
		? await db
				.update(notificationSettings)
				.set({ ...changes, updatedAt: new Date() })
				.where(eq(notificationSettings.accountId, identity.accountId))
				.returning()
		: await db
				.insert(notificationSettings)
				.values({ ...changes, accountId: identity.accountId })
				.returning();

	if (!settings) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to update notification settings",
		});
	}

	return {
		status: "ok",
		settings: convertNotificationSettings(settings),
	};
});
