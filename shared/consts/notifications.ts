/*
 * Règles métier des notifications (données pures : pas d'icônes ni de
 * composants, utilisables côté serveur comme côté interface).
 *
 * Les types eux-mêmes sont déclarés dans shared/models/inbox.ts.
 */

import type {
	NotificationCategory,
	NotificationSeverity,
	NotificationType,
} from "~~/shared/models/inbox";
import type {
	NotificationEmailSetting,
	NotificationSettings,
} from "~~/shared/models/settings";

/*
 * --------------------------------------------------------------------------
 * PALIERS D'INTERACTION
 * --------------------------------------------------------------------------
 *
 * Quand une publication atteint l'un de ces nombres de réactions d'un même
 * type, son auteur est notifié (type `interaction.milestone`).
 *
 * C'est LA variable à modifier pour changer les paliers. Une seule valeur
 * suffit si on ne veut qu'un seul palier : `like: [10]`.
 *
 * - Clé = type de réaction. `default` s'applique aux réactions sans entrée
 *   propre (ex. réactions libres sur les pensées).
 * - Les nombres doivent être strictement croissants.
 * - Les visites ne comptent pas : seules les réactions sont des interactions.
 */
export const INTERACTION_MILESTONES = {
	like: [10, 50, 100, 500, 1000],
	default: [10, 50, 100, 500, 1000],
} as const satisfies Record<string, readonly number[]> & {
	default: readonly number[];
};

export const getMilestones = (reaction: string): readonly number[] =>
	(INTERACTION_MILESTONES as Record<string, readonly number[]>)[reaction] ??
	INTERACTION_MILESTONES.default;

/**
 * Plus haut palier franchi en passant de `previous` à `current` réactions,
 * ou `null` si aucun. À appeler après l'ajout d'une réaction, avec le
 * décompte avant/après. L'unicité en base (dedupeKey
 * `milestone:<post|whisper>:<id>:<reaction>:<palier>`) empêche de notifier
 * deux fois le même palier si l'on aime / retire / aime à nouveau.
 */
export const getReachedMilestone = (
	reaction: string,
	previous: number,
	current: number,
): number | null => {
	let reached: number | null = null;

	for (const threshold of getMilestones(reaction)) {
		if (previous < threshold && current >= threshold) {
			reached = threshold;
		}
	}

	return reached;
};

/*
 * --------------------------------------------------------------------------
 * MAILS
 * --------------------------------------------------------------------------
 */

// Nombre maximal de tentatives d'envoi d'un mail avant de l'abandonner
// (statut `failed` définitif).
export const NOTIFICATION_EMAIL_MAX_ATTEMPTS = 3;

/*
 * Politique d'envoi d'un type de notification :
 *   forced  : toujours envoyé, quels que soient les réglages (sécurité, modération)
 *   setting : envoyé si l'utilisateur a activé le réglage de sa catégorie
 *   never   : jamais envoyé par mail, notification interne uniquement
 */
export type EmailPolicy = "forced" | "setting" | "never";

export const NOTIFICATION_CATEGORY_META: Record<
	NotificationCategory,
	{
		label: string;
		description: string;
		// Réglage qui pilote le mail ; null = mail obligatoire, sans réglage
		setting: NotificationEmailSetting | null;
	}
> = {
	content: {
		label: "Publications des comptes suivis",
		description:
			"Nouvelles publications et pensées des comptes auxquels vous êtes abonné.",
		setting: "contentEmail",
	},
	interactions: {
		label: "Interactions",
		description:
			"Réactions, paliers atteints et réponses à vos publications.",
		setting: "interactionsEmail",
	},
	relations: {
		label: "Relations",
		description: "Nouveaux abonnés et demandes d'abonnement.",
		setting: "relationsEmail",
	},
	rewards: {
		label: "Badges et niveaux",
		description: "Badge ou niveau obtenu, expiré ou révoqué.",
		setting: "rewardsEmail",
	},
	moderation: {
		label: "Modération",
		description:
			"Suivi de vos signalements et sanctions reçues. Toujours envoyé par e-mail.",
		setting: null,
	},
	security: {
		label: "Sécurité",
		description:
			"Changement d'identifiants et suppression du compte. Toujours envoyé par e-mail.",
		setting: null,
	},
	account: {
		label: "Compte et paramètres",
		description: "Modification de votre compte ou de ses paramètres.",
		setting: "accountEmail",
	},
	announcements: {
		label: "Alertes et nouvelles",
		description: "Messages de l'équipe adressés à votre niveau de compte.",
		setting: "announcementsEmail",
	},
};

/*
 * --------------------------------------------------------------------------
 * MÉTADONNÉES PAR TYPE
 * --------------------------------------------------------------------------
 *
 * `Record<NotificationType, ...>` : un type ajouté à NOTIFICATION_TYPES sans
 * entrée ici ne compile plus.
 */

type TypeMeta = {
	category: NotificationCategory;
	// Teinte de la carte (pas de lien avec la pastille)
	severity: NotificationSeverity;
	email: EmailPolicy;
};

const FORCED_CATEGORIES: readonly NotificationCategory[] = [
	"moderation",
	"security",
];

const meta = (
	category: NotificationCategory,
	severity: NotificationSeverity,
	email?: EmailPolicy,
): TypeMeta => ({
	category,
	severity,
	email: email ?? (FORCED_CATEGORIES.includes(category) ? "forced" : "setting"),
});

export const NOTIFICATION_TYPE_META: Record<NotificationType, TypeMeta> = {
	"content.post": meta("content", "info"),
	// Une pensée disparaît après 24 h : un mail arriverait trop tard.
	"content.whisper": meta("content", "info", "never"),

	// Un mail par réaction noierait la boîte d'un auteur populaire :
	// les paliers et les réponses couvrent le besoin.
	"interaction.reaction": meta("interactions", "info", "never"),
	"interaction.milestone": meta("interactions", "success"),
	"interaction.reply": meta("interactions", "info"),

	"relation.follower": meta("relations", "info"),
	"relation.request": meta("relations", "info"),

	"report.received": meta("moderation", "info"),
	"report.rejected": meta("moderation", "info"),
	"report.actioned": meta("moderation", "success"),
	"report.downgraded": meta("moderation", "info"),

	"sanction.issued": meta("moderation", "danger"),
	"sanction.updated": meta("moderation", "warning"),
	"sanction.lifted": meta("moderation", "success"),
	"sanction.expired": meta("moderation", "info"),

	"badge.granted": meta("rewards", "success"),
	"badge.expired": meta("rewards", "info"),
	"badge.revoked": meta("rewards", "warning"),
	"level.granted": meta("rewards", "success"),
	"level.expired": meta("rewards", "info"),
	"level.revoked": meta("rewards", "warning"),

	"security.email_changed": meta("security", "warning"),
	"security.email_confirmed": meta("security", "success"),
	"security.password_changed": meta("security", "warning"),
	"security.deletion_requested": meta("security", "danger"),

	"account.settings_changed": meta("account", "info"),

	// La gravité réelle d'une annonce est celle de l'annonce elle-même
	// (announcements.severity) ; celle-ci n'est qu'une valeur par défaut.
	"announcement.alert": meta("announcements", "warning"),
	"announcement.news": meta("announcements", "info"),
};

export const getNotificationCategory = (
	type: NotificationType,
): NotificationCategory => NOTIFICATION_TYPE_META[type].category;

/**
 * Faut-il envoyer un mail pour cette notification ?
 *
 * `settings` est null quand le compte n'a pas encore de ligne de réglages :
 * les valeurs par défaut s'appliquent (tout désactivé, hors sécurité et
 * modération qui sont obligatoires).
 *
 * Pour `announcement.*`, l'émetteur doit en plus vérifier
 * `announcements.sendEmail` : l'auteur de l'annonce décide si elle donne
 * lieu à un mail.
 */
export const shouldSendEmail = (
	type: NotificationType,
	settings: Pick<NotificationSettings, NotificationEmailSetting> | null,
): boolean => {
	const { category, email } = NOTIFICATION_TYPE_META[type];

	if (email === "never") return false;
	if (email === "forced") return true;

	const key = NOTIFICATION_CATEGORY_META[category].setting;

	return key !== null && settings?.[key] === true;
};
