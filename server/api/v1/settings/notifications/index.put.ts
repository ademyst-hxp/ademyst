import type { H3Event } from "h3";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm";

import { notificationSettings } from "#server/db/schema/settings";
import type { NotificationSettings } from "#shared/models/settings";

import { requireAuth } from "~~/server/utils/middleware/auth";

interface UpdateNotificationSettingsRequest {
	securityAlertsEmail?: boolean;
	moderationAlertsEmail?: boolean;
	broadcastsEmail?: boolean;
	socialEmail?: boolean;
	interactionsEmail?: boolean;
	campaignEmail?: boolean;
}

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

function normalizeNotificationSettings(
	settings: UpdateNotificationSettingsRequest,
	defaultSettings: NotificationSettings,
): NotificationSettings {
	if (
		settings.securityAlertsEmail !== undefined &&
		typeof settings.securityAlertsEmail !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid security alerts mailing preferences",
		});
	}

	if (
		settings.moderationAlertsEmail !== undefined &&
		typeof settings.moderationAlertsEmail !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid moderation alerts mailing preferences",
		});
	}

	if (
		settings.broadcastsEmail !== undefined &&
		typeof settings.broadcastsEmail !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid broadcasts mailing preferences",
		});
	}

	if (
		settings.socialEmail !== undefined &&
		typeof settings.socialEmail !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid social mailing preferences",
		});
	}

	if (
		settings.interactionsEmail !== undefined &&
		typeof settings.interactionsEmail !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid interactions mailing preferences",
		});
	}

	if (
		settings.campaignEmail !== undefined &&
		typeof settings.campaignEmail !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid campaign mailing preferences",
		});
	}

	return {
		...defaultSettings,
		...settings,
	};
}

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	let [settings] = await db
		.select()
		.from(notificationSettings)
		.where(eq(notificationSettings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		const defaultSettings = generateDefaultNotificationSettings();

		[settings] = await db
			.insert(notificationSettings)
			.values({
				...(defaultSettings as NotificationSettings & {
					securityAlertsEmail: boolean;
					moderationAlertsEmail: boolean;
					broadcastsEmail: boolean;
					socialEmail: boolean;
					interactionsEmail: boolean;
					campaignEmail: boolean;
				}),
				accountId: identity.accountId,
			})
			.returning();
	}

	const body = await readBody<UpdateNotificationSettingsRequest>(event);
	const normalizedSettings = normalizeNotificationSettings(
		body,
		settings! as NotificationSettings,
	);

	[settings] = await db
		.update(notificationSettings)
		.set({
			...(normalizedSettings as NotificationSettings & {
				securityAlertsEmail: boolean;
				moderationAlertsEmail: boolean;
				broadcastsEmail: boolean;
				socialEmail: boolean;
				interactionsEmail: boolean;
				campaignEmail: boolean;
			}),
			updatedAt: new Date(),
		})
		.where(eq(notificationSettings.accountId, identity.accountId))
		.returning();

	return {
		status: "ok",
		settings,
	};
});
