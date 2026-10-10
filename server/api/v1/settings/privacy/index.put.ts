import type { H3Event } from "h3";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm";

import { privacySettings } from "#server/db/schema/settings";
import type { PrivacySettings, Visibility } from "#shared/models/settings";

import { requireAuth } from "~~/server/utils/middleware/auth";

interface UpdatePrivacySettingsRequest {
	profileVisibility?: Extract<Visibility, "everyone" | "followers">;
	birthdayVisibility?: Omit<Visibility, "outside">;
	termsOfServiceConsent?: boolean;
	privacyPolicyConsent?: boolean;
}

function generateDefaultPrivacySettings(): PrivacySettings {
	return {
		profileVisibility: "everyone",
		birthdayVisibility: "friends",
		termsOfServiceConsent: false,
		privacyPolicyConsent: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

function normalizePrivacySettings(
	settings: UpdatePrivacySettingsRequest,
	defaultSettings: PrivacySettings,
): PrivacySettings {
	if (
		settings.profileVisibility &&
		!["everyone", "followers"].includes(settings.profileVisibility)
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid profile visibility",
		});
	}

	if (
		settings.birthdayVisibility &&
		!["everyone", "followers", "friends", "me"].includes(
			settings.birthdayVisibility as string,
		)
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid birthday visibility",
		});
	}

	if (
		settings.termsOfServiceConsent !== undefined &&
		typeof settings.termsOfServiceConsent !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid terms of service consent",
		});
	}

	if (
		settings.privacyPolicyConsent !== undefined &&
		typeof settings.privacyPolicyConsent !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid privacy policy consent",
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
		.from(privacySettings)
		.where(eq(privacySettings.accountId, identity.accountId))
		.limit(1);

	if (!settings) {
		const defaultSettings = generateDefaultPrivacySettings();

		[settings] = await db
			.insert(privacySettings)
			.values({
				...defaultSettings as PrivacySettings & {
					profileVisibility: Visibility;
					birthdayVisibility: Visibility;
				},
				accountId: identity.accountId,
			})
			.returning();
	}

	const body = await readBody<UpdatePrivacySettingsRequest>(event);

	const normalizedSettings = normalizePrivacySettings(body, settings! as PrivacySettings);

	[settings] = await db
		.update(privacySettings)
		.set({
			...normalizedSettings as PrivacySettings & {
				profileVisibility: Visibility;
				birthdayVisibility: Visibility;
			},
			updatedAt: new Date(),
		})
		.where(eq(privacySettings.accountId, identity.accountId))
		.returning();

	return {
		status: "ok",
		settings,
	};
});
