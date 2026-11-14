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

// Un réglage = une catégorie de notifications (cf. NOTIFICATION_CATEGORIES).
// Les notifications de sécurité et de modération n'ont volontairement PAS de
// réglage : elles sont toujours envoyées par mail.
export type NotificationSettings = {
	// Email : nouvelles publications / pensées des comptes auxquels on est abonné
	contentEmail: boolean;

	// Email : réactions, paliers et réponses sur mes publications
	interactionsEmail: boolean;

	// Email : nouveaux abonnés et demandes d'abonnement
	relationsEmail: boolean;

	// Email : badges et niveaux
	rewardsEmail: boolean;

	// Email : modification du compte ou de ses paramètres
	accountEmail: boolean;

	// Email : alertes et nouvelles de l'équipe
	announcementsEmail: boolean;

	// SMS's are on the way, I swear

	createdAt: Date;
	updatedAt: Date;
};

// Clés booléennes de NotificationSettings (sans les dates)
export type NotificationEmailSetting = Exclude<
	keyof NotificationSettings,
	"createdAt" | "updatedAt"
>;

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

// Tout est désactivé par défaut : un mail n'est envoyé que si l'utilisateur
// le demande (hors sécurité et modération).
export const defaultNotificationSettings: NotificationSettings = {
	contentEmail: false,
	interactionsEmail: false,
	relationsEmail: false,
	rewardsEmail: false,
	accountEmail: false,
	announcementsEmail: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};
