import { appearance_settings } from "#server/db/schema/settings";
import type { AppearanceSettings } from "#shared/models/settings";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "~~/server/utils/middleware/auth";

function generateDefaultAppearanceSettings(): AppearanceSettings {
	return {
		theme: "light",
		highContrast: false,
		dyslexiaFriendly: false,
		fontSize: 16,
		uiDensity: "comfortable",
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const [settings] = await db
		.select()
		.from(appearance_settings)
		.where(eq(appearance_settings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		const defaultSettings = generateDefaultAppearanceSettings();

		await db.insert(appearance_settings).values({
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
