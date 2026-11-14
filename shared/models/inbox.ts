/*
 * ==========================================================================
 * NOTIFICATIONS : source de vérité des types
 * ==========================================================================
 *
 * Ce fichier est la SEULE déclaration de la liste des types de notifications.
 * Il est consommé par :
 *   - server/db/schema/inbox.ts   (pgEnum + type du champ jsonb `data`)
 *   - shared/consts/notifications.ts (catégorie, gravité, politique mail)
 *   - le futur émetteur serveur (NewNotification) et l'API (Notification)
 *   - l'interface (Notification, union discriminée sur `type`)
 *
 * ATTENTION : ce fichier est importé par le schéma Drizzle, que drizzle-kit
 * charge sans les alias Nuxt (`~~`). Il ne doit donc contenir que des
 * `import type` relatifs (effacés à la compilation) et aucune dépendance
 * runtime.
 *
 * Pour AJOUTER un type de notification :
 *   1. l'ajouter à NOTIFICATION_TYPES ci-dessous ;
 *   2. TypeScript signale alors, dans ce fichier, les 3 maps incomplètes
 *      (NotificationDataMap, NotificationRefsMap, NotificationPayloadMap)
 *      puis, dans shared/consts/notifications.ts, NOTIFICATION_TYPE_META ;
 *   3. ajouter la valeur d'enum côté base (voir .local/PR_NOTIFS/README.md :
 *      ALTER TYPE ... ADD VALUE) ;
 *   4. si le type référence une nouvelle ressource, ajouter la colonne FK.
 * ==========================================================================
 */

import type { Post, Whisper } from "./interactions";
import type { Profile } from "./profiles";
import type { SanctionType } from "./sanctions";
import type { Badge, Level } from "./shop";

/*
 * --------------------------------------------------------------------------
 * ÉNUMÉRATIONS
 * --------------------------------------------------------------------------
 */

// Une catégorie = un réglage de mail (cf. NotificationSettings) sauf
// `moderation` et `security`, toujours envoyées par mail.
export const NOTIFICATION_CATEGORIES = [
	"content", // Nouvelles publications / pensées des comptes auxquels on est abonné
	"interactions", // Réactions, paliers, réponses sur mes publications
	"relations", // Nouveaux abonnés et demandes d'abonnement
	"rewards", // Badges et niveaux (obtention, expiration, révocation)
	"moderation", // Signalements que j'ai faits, sanctions que j'ai reçues
	"security", // Identifiants du compte et suppression
	"account", // Modification du compte ou de ses paramètres
	"announcements", // Alertes et nouvelles de l'équipe
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_TYPES = [
	// content
	"content.post",
	"content.whisper",

	// interactions (hors visites)
	"interaction.reaction",
	"interaction.milestone",
	"interaction.reply",

	// relations
	"relation.follower",
	"relation.request",

	// moderation : évolution d'un signalement fait par l'utilisateur
	"report.received",
	"report.rejected",
	"report.actioned",
	"report.downgraded",

	// moderation : sanction reçue par l'utilisateur
	"sanction.issued",
	"sanction.updated",
	"sanction.lifted",
	"sanction.expired",

	// rewards
	"badge.granted",
	"badge.expired",
	"badge.revoked",
	"level.granted",
	"level.expired",
	"level.revoked",

	// security
	"security.email_changed",
	"security.email_confirmed",
	"security.password_changed",
	"security.deletion_requested",

	// account
	"account.settings_changed",

	// announcements
	"announcement.alert",
	"announcement.news",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Gravité d'affichage (teinte de la carte). Elle ne conditionne PAS la
// pastille : toute notification non lue la fait apparaître.
export const NOTIFICATION_SEVERITIES = [
	"info",
	"success",
	"warning",
	"danger",
] as const;

export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

// Suivi de l'envoi du mail associé à une notification.
//   skipped : aucun mail (réglage désactivé, ou type jamais envoyé par mail)
//   pending : à envoyer (ou envoi en cours)
//   sent    : envoyé
//   failed  : échec, à réessayer (cf. NOTIFICATION_EMAIL_MAX_ATTEMPTS)
export const NOTIFICATION_EMAIL_STATUSES = [
	"skipped",
	"pending",
	"sent",
	"failed",
] as const;

export type NotificationEmailStatus =
	(typeof NOTIFICATION_EMAIL_STATUSES)[number];

export const ANNOUNCEMENT_KINDS = ["alert", "news"] as const;
export type AnnouncementKind = (typeof ANNOUNCEMENT_KINDS)[number];

export const ANNOUNCEMENT_SEVERITIES = ["info", "warning", "critical"] as const;
export type AnnouncementSeverity = (typeof ANNOUNCEMENT_SEVERITIES)[number];

// levels      : tous les comptes dont le niveau (profiles.level) est ciblé
// individuals : une liste explicite de profils
export const ANNOUNCEMENT_AUDIENCES = ["levels", "individuals"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export type ReportKind = "profile" | "post" | "whisper";

/*
 * --------------------------------------------------------------------------
 * GARDE-FOU DE COMPLÉTUDE
 * --------------------------------------------------------------------------
 *
 * `Complete<{...}>` ne compile que si l'objet possède une clé pour CHAQUE
 * type de NOTIFICATION_TYPES : un type oublié dans une map est une erreur.
 */

export type Complete<M extends Record<NotificationType, unknown>> = M;

/*
 * --------------------------------------------------------------------------
 * DATA : petites valeurs scalaires stockées dans la colonne jsonb `data`
 * --------------------------------------------------------------------------
 *
 * Les dates sont des chaînes ISO (le JSON n'a pas de Date). Les snapshots
 * permettent d'afficher une notification même si la ressource d'origine a
 * disparu (sanction supprimée, badge retiré, signalement purgé...).
 */

type NoData = Record<string, never>;

export type SecurityContext = {
	ipAddress: string | null;
	userAgent: string | null;
};

export type ReportSnapshot = {
	reportKind: ReportKind;
	reason: string;
	// Message de la modération, le cas échéant
	note: string | null;
};

export type SanctionSnapshot = {
	sanctionType: SanctionType;
	reason: string;
	details: string | null;
	expiresAt: string | null;
};

export type BadgeSnapshot = {
	badgeId: string;
	badgeName: string;
	reason: string | null;
	expiresAt: string | null;
};

export type LevelSnapshot = {
	levelId: number;
	levelName: string;
	reason: string | null;
	expiresAt: string | null;
};

export type NotificationDataMap = Complete<{
	"content.post": NoData;
	"content.whisper": NoData;

	"interaction.reaction": { reaction: string };
	"interaction.milestone": {
		reaction: string;
		// Palier franchi (cf. INTERACTION_MILESTONES)
		threshold: number;
		// Nombre réel de réactions au moment de la notification
		count: number;
	};
	"interaction.reply": NoData;

	"relation.follower": NoData;
	"relation.request": NoData;

	"report.received": ReportSnapshot;
	"report.rejected": ReportSnapshot;
	"report.actioned": ReportSnapshot;
	"report.downgraded": ReportSnapshot;

	"sanction.issued": SanctionSnapshot;
	"sanction.updated": SanctionSnapshot;
	"sanction.lifted": SanctionSnapshot;
	"sanction.expired": SanctionSnapshot;

	"badge.granted": BadgeSnapshot;
	"badge.expired": BadgeSnapshot;
	"badge.revoked": BadgeSnapshot;
	"level.granted": LevelSnapshot;
	"level.expired": LevelSnapshot;
	"level.revoked": LevelSnapshot;

	"security.email_changed": SecurityContext;
	"security.email_confirmed": SecurityContext;
	"security.password_changed": SecurityContext;
	"security.deletion_requested": SecurityContext;

	"account.settings_changed": {
		section: "profile" | "privacy" | "notifications";
		// Noms des champs modifiés, jamais leurs valeurs
		fields: string[];
	};

	"announcement.alert": NoData;
	"announcement.news": NoData;
}>;

export type NotificationData = NotificationDataMap[NotificationType];

/*
 * --------------------------------------------------------------------------
 * REFS : références (FK) que l'émetteur doit fournir, par type
 * --------------------------------------------------------------------------
 *
 * Les clés correspondent exactement aux colonnes de la table `notifications`
 * (actorId -> actor_id, postId -> post_id...), donc `{ ...refs }` peut être
 * étalé tel quel dans un INSERT. Les CHECK SQL appliquent les mêmes règles.
 */

type ActorRef = { actorId: string };

type SubjectRef =
	| { postId: string; whisperId?: never }
	| { whisperId: string; postId?: never };

type ReportRef =
	| {
			profileReportId: string;
			postReportId?: never;
			whisperReportId?: never;
	  }
	| {
			postReportId: string;
			profileReportId?: never;
			whisperReportId?: never;
	  }
	| {
			whisperReportId: string;
			profileReportId?: never;
			postReportId?: never;
	  };

// null : la ressource a déjà été supprimée au moment de l'émission
// (une sanction levée est supprimée, cf. [sanction].delete). Le snapshot
// `data` suffit alors à l'affichage.
type SanctionRef = { sanctionId?: string | null };
type BadgeEntitlementRef = { badgeEntitlementId?: string | null };
type LevelEntitlementRef = { levelEntitlementId?: string | null };

type NoRef = Record<never, never>;

export type NotificationRefsMap = Complete<{
	"content.post": ActorRef & { postId: string };
	"content.whisper": ActorRef & { whisperId: string };

	"interaction.reaction": ActorRef & SubjectRef;
	"interaction.milestone": SubjectRef;
	"interaction.reply": ActorRef & { postId: string };

	"relation.follower": ActorRef;
	"relation.request": ActorRef;

	"report.received": ReportRef;
	"report.rejected": ReportRef;
	"report.actioned": ReportRef;
	"report.downgraded": ReportRef;

	"sanction.issued": SanctionRef;
	"sanction.updated": SanctionRef;
	"sanction.lifted": SanctionRef;
	"sanction.expired": SanctionRef;

	"badge.granted": BadgeEntitlementRef;
	"badge.expired": BadgeEntitlementRef;
	"badge.revoked": BadgeEntitlementRef;
	"level.granted": LevelEntitlementRef;
	"level.expired": LevelEntitlementRef;
	"level.revoked": LevelEntitlementRef;

	"security.email_changed": NoRef;
	"security.email_confirmed": NoRef;
	"security.password_changed": NoRef;
	"security.deletion_requested": NoRef;

	"account.settings_changed": NoRef;

	"announcement.alert": { announcementId: string };
	"announcement.news": { announcementId: string };
}>;

/*
 * --------------------------------------------------------------------------
 * ÉMISSION : ce que reçoit la fonction d'émission côté serveur
 * --------------------------------------------------------------------------
 */

export type NewNotification<T extends NotificationType = NotificationType> = {
	[K in T]: {
		type: K;

		// Destinataire. `profileId` null = notification de portée « compte »
		// (visible depuis tous les profils du compte).
		accountId: string;
		profileId: string | null;

		refs: NotificationRefsMap[K];
		data: NotificationDataMap[K];

		// Clé d'idempotence : une seconde émission avec la même clé pour le
		// même compte est ignorée (ou rafraîchit la ligne existante).
		// Ex. "reaction:<actorId>:<postId>:like",
		//     "milestone:post:<postId>:like:50", "report:<reportId>:rejected".
		dedupeKey?: string;
	};
}[T];

/*
 * --------------------------------------------------------------------------
 * LECTURE : ce que l'API renvoie et ce que l'interface affiche
 * --------------------------------------------------------------------------
 *
 * Union discriminée sur `type` : `switch (notification.type)` donne à
 * l'interface les bons champs dans chaque branche, sans `"x" in notif`.
 */

export type InteractionSubject =
	| { kind: "post"; post: Post }
	| { kind: "whisper"; whisper: Whisper };

export type ReportTarget =
	| { kind: "profile"; profile: Profile | null }
	| { kind: "post"; post: Post | null }
	| { kind: "whisper"; whisper: Whisper | null };

export type ReportReference = {
	id: string;
	// null si l'objet signalé a été supprimé entre-temps
	target: ReportTarget;
};

export type Announcement = {
	id: string;
	kind: AnnouncementKind;
	severity: AnnouncementSeverity;
	title: string;
	// Texte enrichi, au format Markdown (cf. app/plugins/markdown.ts)
	body: string;
	// Chemin interne ou URL ; à valider côté API (jamais de page inexistante)
	actionUrl: string | null;
	actionLabel: string | null;
	publishedAt: Date;
	expiresAt: Date | null;
	createdAt: Date;
};

// Vue réservée à l'équipe qui émet les annonces
export type AnnouncementDetails = Announcement & {
	audience: AnnouncementAudience;
	targetLevels: number[] | null;
	sendEmail: boolean;
	recipientCount: number;
	authorId: string | null;
};

type NotificationBase<T extends NotificationType> = {
	id: string;
	type: T;
	category: NotificationCategory;
	read: boolean;
	readAt: Date | null;
	createdAt: Date;
	data: NotificationDataMap[T];
};

export type NotificationPayloadMap = Complete<{
	"content.post": { actor: Profile; post: Post };
	"content.whisper": { actor: Profile; whisper: Whisper };

	"interaction.reaction": { actor: Profile; subject: InteractionSubject };
	"interaction.milestone": { subject: InteractionSubject };
	"interaction.reply": { actor: Profile; reply: Post; parent: Post | null };

	"relation.follower": { actor: Profile };
	"relation.request": { actor: Profile };

	"report.received": { report: ReportReference };
	"report.rejected": { report: ReportReference };
	"report.actioned": { report: ReportReference };
	"report.downgraded": { report: ReportReference };

	// Pas d'objet Sanction complet : il expose le compte et l'auteur de la
	// sanction. Le snapshot `data` suffit ; `sanctionId` sert au lien.
	"sanction.issued": { sanctionId: string | null };
	"sanction.updated": { sanctionId: string | null };
	"sanction.lifted": { sanctionId: string | null };
	"sanction.expired": { sanctionId: string | null };

	"badge.granted": { badge: Badge | null };
	"badge.expired": { badge: Badge | null };
	"badge.revoked": { badge: Badge | null };
	"level.granted": { level: Level | null };
	"level.expired": { level: Level | null };
	"level.revoked": { level: Level | null };

	"security.email_changed": unknown;
	"security.email_confirmed": unknown;
	"security.password_changed": unknown;
	"security.deletion_requested": unknown;

	"account.settings_changed": unknown;

	"announcement.alert": { announcement: Announcement };
	"announcement.news": { announcement: Announcement };
}>;

// Notification d'un type précis : NotificationOf<"interaction.reply">
export type NotificationOf<T extends NotificationType> = NotificationBase<T> &
	NotificationPayloadMap[T];

// Toute notification, discriminée sur `type`
export type Notification = {
	[T in NotificationType]: NotificationOf<T>;
}[NotificationType];

export type NotificationFilter = "all" | NotificationCategory;

export type InboxPage = {
	notifications: Notification[];
	next: number;
	hasNext: boolean;
};

// Alimente la pastille : `unread` compte TOUTES les notifications non lues,
// quelle que soit leur catégorie.
export type InboxCounts = {
	unread: number;
	byCategory: Record<NotificationCategory, number>;
};

/*
 * --------------------------------------------------------------------------
 * ANNONCES : ce que reçoit la fonction « lancer une alerte / une nouvelle »
 * --------------------------------------------------------------------------
 */

export type NewAnnouncement = {
	kind: AnnouncementKind;
	// Défaut côté serveur : "info" pour une nouvelle, "warning" pour une alerte
	severity?: AnnouncementSeverity;
	title: string;
	body: string;
	actionUrl?: string | null;
	actionLabel?: string | null;

	// Envoie aussi un mail aux comptes qui l'ont demandé (announcementsEmail)
	sendEmail?: boolean;
	expiresAt?: Date | null;

	audience:
		| { type: "levels"; levels: number[] }
		| { type: "individuals"; profileIds: string[] };
};
