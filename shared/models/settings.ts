export type Visibility =
	| "outside"
	| "everyone"
	| "followers"
	| "friends"
	| "me";

export type UiDensity = "compact" | "comfortable";

export type AppearanceSettings = {
	theme: string;
	highContrast: boolean;
	fontSize: number;
	uiDensity: UiDensity;
	alter: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type PrivacySettings = {
	profileVisibility: Visibility;
	birthdayVisibility: Visibility;
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export const defaultAppearanceSettings: AppearanceSettings = {
	theme: "system",
	highContrast: false,
	fontSize: 16,
	uiDensity: "comfortable",
	alter: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};

export const defaultPrivacySettings: PrivacySettings = {
	profileVisibility: "everyone",
	birthdayVisibility: "everyone",
	termsOfServiceConsent: false,
	privacyPolicyConsent: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};
