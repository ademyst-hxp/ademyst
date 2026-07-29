import { privacy_settings } from "#server/db/schema/settings";
import type { PrivacySettings, Visibility } from "#shared/models/settings";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "~~/server/utils/middleware/auth";

interface UpdatePrivacySettingsRequest {
	profileVisibility?: Visibility;
	birthdayVisibility?: Visibility;
}

function generateDefaultPrivacySettings(): PrivacySettings {
	return {
		profileVisibility: "everyone",
		birthdayVisibility: "friends",
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

function normalizePrivacySettings(settings: UpdatePrivacySettingsRequest, defaultSettings: PrivacySettings): PrivacySettings {
	if (settings.profileVisibility && !["everyone", "friends", "private"].includes(settings.profileVisibility)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid profile visibility",
		});
	}

	if (settings.birthdayVisibility && !["everyone", "friends", "private"].includes(settings.birthdayVisibility)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid birthday visibility",
		});
	}

	return {
		...defaultSettings,
		...settings
	}
}

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	let [settings] = await db
		.select()
		.from(privacy_settings)
		.where(eq(privacy_settings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		const defaultSettings = generateDefaultPrivacySettings();

		[settings] = await db.insert(privacy_settings).values({
			...defaultSettings,
			accountId: identity.accountId,
		}).returning();
	}

	const body = await readBody<UpdatePrivacySettingsRequest>(event);

	const normalizedSettings = normalizePrivacySettings(body, settings!);

	[settings] = await db.update(privacy_settings)
		.set({
			...normalizedSettings,
			updatedAt: new Date(),
		})
		.where(eq(privacy_settings.accountId, identity.accountId))
		.returning();

	return {
		status: "ok",
		settings,
	};
});
