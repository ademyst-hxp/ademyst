import type {
	AppearanceSettings as DbAppearanceSettings,
	PrivacySettings as DbPrivacySettings,
} from "~~/server/db/schema/settings";
import type {
	AppearanceSettings,
	PrivacySettings,
} from "~~/shared/models/settings";

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
