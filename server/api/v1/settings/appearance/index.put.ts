import { appearance_settings } from "#server/db/schema/settings";
import type { AppearanceSettings } from "#shared/models/settings";

import { db } from "#server/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "~~/server/utils/middleware/auth";

interface UpdateAppearanceSettingsRequest {
	theme?: string;
	highContrast?: boolean;
	dyslexiaFriendly?: boolean;
	fontSize?: number;
	uiDensity?: "compact" | "comfortable" | "auto";
}

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

function normalizeAppearanceSettings(settings: UpdateAppearanceSettingsRequest, defaultSettings: AppearanceSettings): AppearanceSettings {
	if (settings.theme && !["light", "dark", "system"].includes(settings.theme)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid theme",
		});
	}

	if (settings.uiDensity && !["compact", "comfortable", "auto"].includes(settings.uiDensity)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid UI density",
		});
	}

	if (settings.fontSize && (settings.fontSize < 10 || settings.fontSize > 30)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Font size must be between 10 and 30",
		});
	}

	if (settings.highContrast !== undefined && typeof settings.highContrast !== "boolean") {
		throw createError({
			statusCode: 400,
			statusMessage: "High contrast must be a boolean",
		});
	}

	if (settings.dyslexiaFriendly !== undefined && typeof settings.dyslexiaFriendly !== "boolean") {
		throw createError({
			statusCode: 400,
			statusMessage: "Dyslexia friendly must be a boolean",
		});
	}

	return {
		...defaultSettings,
		...settings
	}
}

export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	let [settings] = await db
		.select()
		.from(appearance_settings)
		.where(eq(appearance_settings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		const defaultSettings = generateDefaultAppearanceSettings();

		[settings] = await db.insert(appearance_settings).values({
			...defaultSettings,
			accountId: identity.accountId,
		}).returning();
	}

	const body = await readBody<UpdateAppearanceSettingsRequest>(event);

	const normalizedSettings = normalizeAppearanceSettings(body, settings!);

	[settings] = await db.update(appearance_settings)
		.set({
			...normalizedSettings,
			updatedAt: new Date(),
		})
		.where(eq(appearance_settings.accountId, identity.accountId))
		.returning();

	return {
		status: "ok",
		settings,
	};
});
