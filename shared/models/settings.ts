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
