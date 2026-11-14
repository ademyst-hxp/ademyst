import {
	BellAlertIcon,
	ChatBubbleLeftRightIcon,
	CheckBadgeIcon,
	ClockIcon,
	DocumentTextIcon,
	EnvelopeIcon,
	FlagIcon,
	HeartIcon,
	LockClosedIcon,
	MegaphoneIcon,
	ScaleIcon,
	SparklesIcon,
	StarIcon,
	UserPlusIcon,
} from "@heroicons/vue/24/outline";
import type { Component } from "vue";

import { NOTIFICATION_TYPE_META } from "~~/shared/consts/notifications";
import type {
	Notification,
	NotificationCategory,
	NotificationFilter,
	NotificationSeverity,
	NotificationType,
} from "~~/shared/models/inbox";
import type { Post, Whisper } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";
import type { Badge } from "~~/shared/models/shop";
import type { SanctionType } from "~~/shared/models/sanctions";

/*
 * --------------------------------------------------------------------------
 * Filtres de la page (une entrée par catégorie)
 * --------------------------------------------------------------------------
 */

export const NOTIFICATION_FILTERS: { name: string; value: NotificationFilter }[] =
	[
		{ name: "Toutes", value: "all" },
		{ name: "Publications", value: "content" },
		{ name: "Interactions", value: "interactions" },
		{ name: "Relations", value: "relations" },
		{ name: "Récompenses", value: "rewards" },
		{ name: "Modération", value: "moderation" },
		{ name: "Sécurité", value: "security" },
		{ name: "Compte", value: "account" },
		{ name: "Annonces", value: "announcements" },
	];

export const NOTIFICATION_CATEGORY_ICONS: Record<NotificationCategory, Component> =
	{
		content: DocumentTextIcon,
		interactions: HeartIcon,
		relations: UserPlusIcon,
		rewards: StarIcon,
		moderation: ScaleIcon,
		security: LockClosedIcon,
		account: BellAlertIcon,
		announcements: MegaphoneIcon,
	};

/*
 * --------------------------------------------------------------------------
 * Gravité : teinte de la carte
 * --------------------------------------------------------------------------
 *
 * Les classes sont écrites en entier : Tailwind ne détecte pas les noms
 * construits dynamiquement.
 */

export const SEVERITY_TEXT: Record<NotificationSeverity, string> = {
	info: "text-info",
	success: "text-success-darkened",
	warning: "text-warning-darkened",
	danger: "text-danger",
};

// La gravité d'une annonce est celle choisie par son auteur
export const getNotificationSeverity = (
	notification: Notification,
): NotificationSeverity => {
	if (
		notification.type === "announcement.alert" ||
		notification.type === "announcement.news"
	) {
		switch (notification.announcement?.severity) {
			case "critical":
				return "danger";
			case "warning":
				return "warning";
			case "info":
				return "info";
		}
	}

	return NOTIFICATION_TYPE_META[notification.type].severity;
};

/*
 * --------------------------------------------------------------------------
 * Icône par type
 * --------------------------------------------------------------------------
 */

export const NOTIFICATION_ICONS: Record<NotificationType, Component> = {
	"content.post": DocumentTextIcon,
	"content.whisper": SparklesIcon,

	"interaction.reaction": HeartIcon,
	"interaction.milestone": StarIcon,
	"interaction.reply": ChatBubbleLeftRightIcon,

	"relation.follower": UserPlusIcon,
	"relation.request": ClockIcon,

	"report.received": FlagIcon,
	"report.rejected": FlagIcon,
	"report.actioned": FlagIcon,
	"report.downgraded": FlagIcon,

	"sanction.issued": ScaleIcon,
	"sanction.updated": ScaleIcon,
	"sanction.lifted": ScaleIcon,
	"sanction.expired": ScaleIcon,

	"badge.granted": CheckBadgeIcon,
	"badge.expired": CheckBadgeIcon,
	"badge.revoked": CheckBadgeIcon,
	"level.granted": CheckBadgeIcon,
	"level.expired": CheckBadgeIcon,
	"level.revoked": CheckBadgeIcon,

	"security.email_changed": EnvelopeIcon,
	"security.email_confirmed": EnvelopeIcon,
	"security.password_changed": LockClosedIcon,
	"security.deletion_requested": LockClosedIcon,

	"account.settings_changed": BellAlertIcon,

	"announcement.alert": MegaphoneIcon,
	"announcement.news": MegaphoneIcon,
};

/*
 * --------------------------------------------------------------------------
 * Textes
 * --------------------------------------------------------------------------
 */

export const getActorName = (
	actor: Pick<Profile, "displayName" | "name">,
): string => actor.displayName || `@${actor.name}`;

export const getNotificationActor = (
	notification: Notification,
): Profile | null =>
	"actor" in notification && notification.actor ? notification.actor : null;

export const getNotificationTitle = (notification: Notification): string => {
	const actor = getNotificationActor(notification);
	const who = actor ? getActorName(actor) : "Quelqu'un";

	switch (notification.type) {
		case "content.post":
			return `${who} a publié une nouvelle publication`;
		case "content.whisper":
			return `${who} a partagé une nouvelle pensée`;
		case "interaction.reaction":
			return `${who} a réagi à ${
				notification.subject?.kind === "whisper"
					? "votre pensée"
					: "votre publication"
			}`;
		case "interaction.milestone":
			return `${
				notification.subject?.kind === "whisper"
					? "Votre pensée"
					: "Votre publication"
			} a atteint ${notification.data.threshold} réactions`;
		case "interaction.reply":
			return `${who} a répondu à votre publication`;
		case "relation.follower":
			return `${who} vous suit désormais`;
		case "relation.request":
			return `${who} souhaite vous suivre`;
		case "report.received":
			return "Votre signalement a bien été reçu";
		case "report.rejected":
			return "Votre signalement a été rejeté";
		case "report.actioned":
			return "Une action a été prise suite à votre signalement";
		case "report.downgraded":
			return "Le niveau de votre signalement a été réduit";
		case "sanction.issued":
			return "Une sanction a été appliquée à votre compte";
		case "sanction.updated":
			return "Une sanction de votre compte a été modifiée";
		case "sanction.lifted":
			return "Une sanction de votre compte a été levée";
		case "sanction.expired":
			return "Une sanction de votre compte a expiré";
		case "badge.granted":
			return `Vous avez obtenu le badge « ${notification.data.badgeName} »`;
		case "badge.expired":
			return `Le badge « ${notification.data.badgeName} » a expiré`;
		case "badge.revoked":
			return `Le badge « ${notification.data.badgeName} » vous a été retiré`;
		case "level.granted":
			return `Vous avez atteint le niveau « ${notification.data.levelName} »`;
		case "level.expired":
			return `Votre niveau « ${notification.data.levelName} » a expiré`;
		case "level.revoked":
			return `Votre niveau « ${notification.data.levelName} » a été révoqué`;
		case "security.email_changed":
			return "Votre adresse e-mail a été modifiée";
		case "security.email_confirmed":
			return "Votre adresse e-mail a été confirmée";
		case "security.password_changed":
			return "Votre mot de passe a été modifié";
		case "security.deletion_requested":
			return "Une suppression de votre compte a été demandée";
		case "account.settings_changed":
			return `Vos paramètres ${SETTINGS_SECTION_LABELS[notification.data.section]} ont été modifiés`;
		case "announcement.alert":
		case "announcement.news":
			return notification.announcement?.title ?? "Annonce de l'équipe";
	}
};

const SETTINGS_SECTION_LABELS = {
	profile: "de profil",
	privacy: "de confidentialité",
	notifications: "de notifications",
} as const;

const SANCTION_LABELS: Record<SanctionType, string> = {
	warning: "Avertissement",
	mute: "Restriction",
	shadow_ban: "Shadow ban",
	ban: "Suspension",
};

const REPORT_KIND_LABELS = {
	profile: "un profil",
	post: "une publication",
	whisper: "une pensée",
} as const;

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

const formatDate = (iso: string): string => dateFormat.format(new Date(iso));

// Lignes complémentaires, tirées des snapshots stockés avec la notification
// (elles restent lisibles même si la ressource d'origine a été supprimée).
export const getNotificationDetails = (
	notification: Notification,
): string[] => {
	const lines: string[] = [];

	switch (notification.type) {
		case "interaction.milestone":
			lines.push(
				`${notification.data.count} réactions au moment de la notification.`,
			);
			break;

		case "report.received":
		case "report.rejected":
		case "report.actioned":
		case "report.downgraded": {
			const { reportKind, reason, note } = notification.data;
			lines.push(
				`Signalement de ${REPORT_KIND_LABELS[reportKind]} : ${reason}`,
			);
			if (note) lines.push(`Message de la modération : ${note}`);
			break;
		}

		case "sanction.issued":
		case "sanction.updated":
		case "sanction.lifted":
		case "sanction.expired": {
			const { sanctionType, reason, details, expiresAt } =
				notification.data;
			lines.push(`${SANCTION_LABELS[sanctionType]} : ${reason}`);
			if (details) lines.push(details);
			if (expiresAt && notification.type !== "sanction.expired") {
				lines.push(`Jusqu'au ${formatDate(expiresAt)}`);
			}
			break;
		}

		case "badge.granted":
		case "badge.expired":
		case "badge.revoked":
		case "level.granted":
		case "level.expired":
		case "level.revoked": {
			const { reason, expiresAt } = notification.data;
			if (reason) lines.push(reason);
			if (expiresAt && notification.type.endsWith(".granted")) {
				lines.push(`Valable jusqu'au ${formatDate(expiresAt)}`);
			}
			break;
		}

		case "security.email_changed":
		case "security.email_confirmed":
		case "security.password_changed":
		case "security.deletion_requested":
			if (notification.data.ipAddress) {
				lines.push(`Depuis l'adresse IP ${notification.data.ipAddress}`);
			}
			if (notification.type !== "security.email_confirmed") {
				lines.push("Ce n'était pas vous ? Sécurisez votre compte.");
			}
			break;
	}

	return lines;
};

/*
 * --------------------------------------------------------------------------
 * Aperçu du contenu cité
 * --------------------------------------------------------------------------
 *
 * Les ressources supprimées ne donnent pas d'aperçu : le titre et les
 * détails suffisent.
 */

export type NotificationPreview =
	| { kind: "post"; post: Post }
	| { kind: "whisper"; whisper: Whisper }
	| { kind: "reward"; name: string | null; badge: Badge | null }
	| {
			kind: "announcement";
			body: string;
			actionLabel: string | null;
			hasAction: boolean;
	  };

export const getNotificationPreview = (
	notification: Notification,
): NotificationPreview | null => {
	switch (notification.type) {
		case "content.post":
			return notification.post
				? { kind: "post", post: notification.post }
				: null;
		case "content.whisper":
			return notification.whisper
				? { kind: "whisper", whisper: notification.whisper }
				: null;
		case "interaction.reply":
			return notification.reply
				? { kind: "post", post: notification.reply }
				: null;
		case "interaction.reaction":
		case "interaction.milestone": {
			const subject = notification.subject;
			if (subject?.kind === "post" && subject.post) {
				return { kind: "post", post: subject.post };
			}
			if (subject?.kind === "whisper" && subject.whisper) {
				return { kind: "whisper", whisper: subject.whisper };
			}
			return null;
		}
		case "level.granted":
		case "level.expired":
		case "level.revoked":
			return notification.level || notification.badge
				? {
						kind: "reward",
						name: notification.level?.name ?? null,
						badge: notification.badge,
					}
				: null;
		case "badge.granted":
		case "badge.expired":
		case "badge.revoked":
			return notification.badge
				? { kind: "reward", name: null, badge: notification.badge }
				: null;
		case "announcement.alert":
		case "announcement.news":
			return notification.announcement
				? {
						kind: "announcement",
						body: notification.announcement.body,
						actionLabel: notification.announcement.actionLabel,
						hasAction: !!notification.announcement.actionUrl,
					}
				: null;
		default:
			return null;
	}
};

/*
 * --------------------------------------------------------------------------
 * Navigation
 * --------------------------------------------------------------------------
 *
 * Renvoie la page que la notification ouvre, ou null quand elle n'a pas de
 * destination (la carte n'est alors pas cliquable).
 */

export const getNotificationLink = (
	notification: Notification,
): string | null => {
	switch (notification.type) {
		case "content.post":
			return notification.post ? `/posts/${notification.post.id}` : null;
		case "content.whisper":
			return notification.whisper
				? `/discover?whisper=${notification.whisper.id}`
				: null;
		case "interaction.reply":
			return notification.reply ? `/posts/${notification.reply.id}` : null;
		case "interaction.reaction":
		case "interaction.milestone": {
			const subject = notification.subject;
			if (subject?.kind === "post" && subject.post) {
				return `/posts/${subject.post.id}`;
			}
			if (subject?.kind === "whisper" && subject.whisper) {
				return `/discover?whisper=${subject.whisper.id}`;
			}
			return null;
		}
		case "relation.follower":
		case "relation.request":
			return notification.actor ? `/@${notification.actor.name}` : null;
		case "badge.granted":
		case "badge.expired":
		case "badge.revoked":
		case "level.granted":
		case "level.expired":
		case "level.revoked":
			return "/settings/badges";
		case "security.email_changed":
		case "security.email_confirmed":
		case "security.password_changed":
		case "security.deletion_requested":
			return "/settings/account";
		case "account.settings_changed":
			return `/settings/${notification.data.section}`;
		case "announcement.alert":
		case "announcement.news":
			return notification.announcement?.actionUrl ?? null;
		default:
			return null;
	}
};

/*
 * --------------------------------------------------------------------------
 * Regroupement par jour
 * --------------------------------------------------------------------------
 */

export type NotificationGroup = {
	label: string;
	notifications: Notification[];
};

const startOfDay = (date: Date): number =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const DAY = 24 * 60 * 60 * 1000;

// Les notifications arrivent triées de la plus récente à la plus ancienne :
// l'ordre des groupes suit celui de la liste.
export const groupNotificationsByDay = (
	notifications: Notification[],
	now: Date = new Date(),
): NotificationGroup[] => {
	const today = startOfDay(now);
	const groups: NotificationGroup[] = [];

	for (const notification of notifications) {
		const age = Math.round(
			(today - startOfDay(new Date(notification.createdAt))) / DAY,
		);
		const label =
			age <= 0
				? "Aujourd'hui"
				: age === 1
					? "Hier"
					: age < 7
						? "Cette semaine"
						: "Plus ancien";

		const last = groups[groups.length - 1];
		if (last?.label === label) {
			last.notifications.push(notification);
		} else {
			groups.push({ label, notifications: [notification] });
		}
	}

	return groups;
};
