import { H3Event } from "h3";

import { createDb } from "#server/db";
import { eq } from "drizzle-orm";

import { appearanceSettings } from "#server/db/schema/settings";
import type { AppearanceSettings } from "#shared/models/settings";

import { requireAuth } from "~~/server/utils/middleware/auth";

interface UpdateAppearanceSettingsRequest {
	theme?: string;
	highContrast?: boolean;
	fontSize?: number;
	uiDensity?: "compact" | "comfortable";
	alter?: boolean;
}

function generateDefaultAppearanceSettings(): AppearanceSettings {
	return {
		theme: "light",
		highContrast: false,
		fontSize: 16,
		uiDensity: "comfortable",
		alter: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

function normalizeAppearanceSettings(
	settings: UpdateAppearanceSettingsRequest,
	defaultSettings: AppearanceSettings,
): UpdateAppearanceSettingsRequest {
	if (
		settings.theme &&
		!["light", "dark", "system"].includes(settings.theme)
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid theme",
		});
	}

	if (
		settings.uiDensity &&
		!["compact", "comfortable"].includes(settings.uiDensity)
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid UI density",
		});
	}

	if (
		settings.fontSize &&
		(settings.fontSize < 10 || settings.fontSize > 30)
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Font size must be between 10 and 30",
		});
	}

	if (
		settings.highContrast !== undefined &&
		typeof settings.highContrast !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "High contrast must be a boolean",
		});
	}

	if (settings.alter !== undefined && typeof settings.alter !== "boolean") {
		throw createError({
			statusCode: 400,
			statusMessage: "Alter must be a boolean",
		});
	}

	const normalizedSettings: UpdateAppearanceSettingsRequest = {
		theme: settings.theme ?? defaultSettings.theme,
		highContrast: settings.highContrast ?? defaultSettings.highContrast,
		fontSize: settings.fontSize ?? defaultSettings.fontSize,
		uiDensity: settings.uiDensity ?? defaultSettings.uiDensity,
		alter: settings.alter ?? defaultSettings.alter,
	};

	return normalizedSettings;
}

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const identity = await requireAuth(event);

		if (!identity) {
			throw createError({
				statusCode: 401,
				statusMessage: "Unauthorized",
			});
		}

		let [settings] = await db
			.select()
			.from(appearanceSettings)
			.where(eq(appearanceSettings.accountId, identity.accountId))
			.limit(1);

		if (!settings) {
			const defaultSettings = generateDefaultAppearanceSettings();

			[settings] = await db
				.insert(appearanceSettings)
				.values({
					...defaultSettings,
					id: undefined,
					accountId: identity.accountId,
					updatedAt: new Date(),
					createdAt: new Date(),
				})
				.returning();
		}

		const body = await readBody<UpdateAppearanceSettingsRequest>(event);
		const normalizedSettings = normalizeAppearanceSettings(body, settings!);

		[settings] = await db
			.update(appearanceSettings)
			.set({
				...normalizedSettings,
				updatedAt: new Date(),
			})
			.where(eq(appearanceSettings.accountId, identity.accountId))
			.returning();

		if (!settings) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to update appearance settings",
			});
		}

		setCookie(event, "theme", settings.theme, {
			maxAge: 60 * 60 * 24 * 30, // 30 days
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});

		setCookie(
			event,
			"high-contrast",
			settings.highContrast ? "true" : "false",
			{
				maxAge: 60 * 60 * 24 * 30, // 30 days
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			},
		);

		setCookie(event, "font-size", settings.fontSize.toString(), {
			maxAge: 60 * 60 * 24 * 30, // 30 days
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});

		setCookie(event, "density", settings.uiDensity, {
			maxAge: 60 * 60 * 24 * 30, // 30 days
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});

		setCookie(event, "alter", settings.alter ? "true" : "false", {
			maxAge: 60 * 60 * 24 * 30, // 30 days
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});

		return {
			status: "ok",
			settings,
		};
	} finally {
		await client.end();
	}
});
