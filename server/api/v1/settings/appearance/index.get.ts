import { appearanceSettings } from "#server/db/schema/settings";
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
		.from(appearanceSettings)
		.where(eq(appearanceSettings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		const defaultSettings = generateDefaultAppearanceSettings();

		await db.insert(appearanceSettings).values({
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
