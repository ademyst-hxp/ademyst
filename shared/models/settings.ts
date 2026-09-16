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
	profileVisibility: Extract<Visibility, "everyone" | "followers">;
	birthdayVisibility: Omit<Visibility, "outside">;
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type NotificationSettings = {
	// Email notification settings
	securityAlertsEmail: boolean;
	moderationAlertsEmail: boolean;
	broadcastsEmail: boolean;
	socialEmail: boolean;
	interactionsEmail: boolean;
	campaignEmail: boolean;

	// SMS's are on the way, I swear

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

export const defaultNotificationSettings: NotificationSettings = {
	securityAlertsEmail: true,
	moderationAlertsEmail: true,
	broadcastsEmail: false,
	socialEmail: false,
	interactionsEmail: false,
	campaignEmail: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};
