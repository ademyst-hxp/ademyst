import type { AppearanceSettings as DbAppearanceSettings } from "~~/server/db/schema/settings";
import type { NotificationSettings as DbNotificationSettings } from "~~/server/db/schema/settings";
import type { PrivacySettings as DbPrivacySettings } from "~~/server/db/schema/settings";

import type { AppearanceSettings } from "~~/shared/models/settings";
import type { NotificationSettings } from "~~/shared/models/settings";
import type { PrivacySettings } from "~~/shared/models/settings";

export function convertAppearanceSettings(
	setting: DbAppearanceSettings,
): AppearanceSettings {
	return {
		theme: setting.theme,
		highContrast: setting.highContrast,
		alter: setting.alter,
		fontSize: setting.fontSize,
		uiDensity: setting.uiDensity,
		createdAt: setting.createdAt,
		updatedAt: setting.updatedAt,
	};
}

export function convertPrivacySettings(
	setting: DbPrivacySettings,
): PrivacySettings {
	return {
		profileVisibility: setting.profileVisibility as Extract<
			PrivacySettings["profileVisibility"],
			"everyone" | "followers"
		>,
		birthdayVisibility: setting.birthdayVisibility as Omit<
			PrivacySettings["birthdayVisibility"],
			"outside"
		>,
		termsOfServiceConsent: setting.termsOfServiceConsent,
		privacyPolicyConsent: setting.privacyPolicyConsent,
		createdAt: setting.createdAt,
		updatedAt: setting.updatedAt,
	};
}

export function convertNotificationSettings(
	setting: DbNotificationSettings,
): NotificationSettings {
	return {
		securityAlertsEmail: setting.securityAlertsEmail,
		moderationAlertsEmail: setting.moderationAlertsEmail,
		broadcastsEmail: setting.broadcastsEmail,
		socialEmail: setting.socialEmail,
		interactionsEmail: setting.interactionsEmail,
		campaignEmail: setting.campaignEmail,
		createdAt: setting.createdAt,
		updatedAt: setting.updatedAt,
	};
}
