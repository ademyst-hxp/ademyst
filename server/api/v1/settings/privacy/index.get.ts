import { privacy_settings } from "#server/db/schema/settings";
import type { PrivacySettings } from "#shared/models/settings";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "~~/server/utils/middleware/auth";

function generateDefaultPrivacySettings(): PrivacySettings {
	return {
		profileVisibility: "everyone",
		birthdayVisibility: "friends",
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const [settings] = await db
		.select()
		.from(privacy_settings)
		.where(eq(privacy_settings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		const defaultSettings = generateDefaultPrivacySettings();

		await db.insert(privacy_settings).values({
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
