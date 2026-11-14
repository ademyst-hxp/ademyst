import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// Imports relatifs (pas d'alias `~~`) : drizzle-kit charge ce fichier seul.
import {
	ANNOUNCEMENT_AUDIENCES,
	ANNOUNCEMENT_KINDS,
	ANNOUNCEMENT_SEVERITIES,
	NOTIFICATION_EMAIL_STATUSES,
	NOTIFICATION_TYPES,
	type NotificationData,
} from "../../../shared/models/inbox";
import { accounts } from "./accounts";
import { badgesEntitlements, levelsEntitlements } from "./entitlements";
import { posts, whispers } from "./interactions";
import { profiles } from "./profiles";
import { postReports, profileReports, whisperReports } from "./reports";
import { sanctions } from "./sanctions";

/*
 * ==========================================================================
 * NOTIFICATIONS
 * ==========================================================================
 *
 * Deux tables remplacent les six anciennes (notification_post, _whisper,
 * _follow, _sanction, _post_sanction, _report) :
 *
 *   announcements  : le contenu (texte enrichi) d'une alerte ou d'une
 *                    nouvelle, stocké UNE fois ;
 *   notifications  : une ligne par destinataire et par évènement, tous types
 *                    confondus. Les listes de types sont déclarées dans
 *                    shared/models/inbox.ts.
 *
 * Une seule table = une seule requête pour la liste, la pagination, le
 * compteur de la pastille et le « tout marquer comme lu ».
 */

/*
 * --------------------------------------------------------------------------
 * ANNOUNCEMENTS (alertes et nouvelles de l'équipe)
 * --------------------------------------------------------------------------
 *
 * Diffusion « fan-out » : à la publication, une ligne `notifications`
 * (type announcement.alert | announcement.news) est créée par destinataire.
 *   - audience `levels`      : un seul INSERT ... SELECT sur `profiles`
 *                              (profiles.level = ANY(target_levels)) ;
 *   - audience `individuals` : une ligne par profil désigné.
 * Chaque destinataire garde ainsi son propre état lu / non lu, et les alertes
 * apparaissent dans la même liste que les autres notifications.
 *
 * Conséquence assumée : un compte créé APRÈS la publication ne reçoit pas
 * l'annonce.
 */

export const announcementKindEnum = pgEnum(
	"announcement_kind",
	ANNOUNCEMENT_KINDS,
);

export const announcementSeverityEnum = pgEnum(
	"announcement_severity",
	ANNOUNCEMENT_SEVERITIES,
);

export const announcementAudienceEnum = pgEnum(
	"announcement_audience",
	ANNOUNCEMENT_AUDIENCES,
);

export const announcements = pgTable(
	"announcements",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		kind: announcementKindEnum("kind").notNull(),
		severity: announcementSeverityEnum("severity").notNull().default("info"),

		title: varchar("title", { length: 120 }).notNull(),

		// Texte enrichi, au format Markdown
		body: text("body").notNull(),

		// Lien optionnel (chemin interne ou URL), validé par l'API
		actionUrl: text("action_url"),
		actionLabel: varchar("action_label", { length: 48 }),

		audience: announcementAudienceEnum("audience").notNull(),

		// Niveaux de compte visés (profiles.level) ; null si audience `individuals`
		targetLevels: integer("target_levels").array(),

		// Envoie aussi un mail aux comptes qui ont activé announcementsEmail
		sendEmail: boolean("send_email").notNull().default(false),

		// Auteur de l'annonce ; null si le compte a été supprimé
		authorId: uuid("author_id").references(() => accounts.id, {
			onDelete: "set null",
		}),

		// Nombre de notifications créées à la publication
		recipientCount: integer("recipient_count").notNull().default(0),

		publishedAt: timestamp("published_at").defaultNow().notNull(),

		// Passé cette date, l'annonce n'est plus affichée (alertes temporaires)
		expiresAt: timestamp("expires_at"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// audience `levels` <=> au moins un niveau ciblé
		check(
			"announcements_audience_levels",
			sql`(${table.audience}::text = 'levels') = (coalesce(cardinality(${table.targetLevels}), 0) > 0)`,
		),

		check(
			"announcements_expires_after_published",
			sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.publishedAt}`,
		),
	],
).enableRLS();

export type Announcement = typeof announcements.$inferSelect;

/*
 * --------------------------------------------------------------------------
 * NOTIFICATIONS
 * --------------------------------------------------------------------------
 */

export const notificationTypeEnum = pgEnum(
	"notification_type",
	NOTIFICATION_TYPES,
);

export const notificationEmailStatusEnum = pgEnum(
	"notification_email_status",
	NOTIFICATION_EMAIL_STATUSES,
);

export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		/*
		 * Destinataire. `accountId` est toujours renseigné (adresse e-mail,
		 * réglages, évènements de sécurité) ; `profileId` ne l'est que pour les
		 * notifications propres à un profil (abonné, réaction...).
		 *
		 * Boîte de réception de l'identité (accountId, profileId) :
		 *   account_id = :accountId AND (profile_id IS NULL OR profile_id = :profileId)
		 */
		accountId: uuid("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),

		profileId: varchar("profile_id", { length: 10 }).references(
			() => profiles.id,
			{ onDelete: "cascade" },
		),

		type: notificationTypeEnum("type").notNull(),

		/*
		 * Références. Les colonnes obligatoires par type sont imposées par les
		 * CHECK ci-dessous (miroir de NotificationRefsMap dans shared/models/inbox.ts).
		 *
		 * CASCADE   : la notification n'a plus de sens sans la ressource.
		 * SET NULL  : la ressource peut disparaître alors que l'historique doit
		 *             rester lisible (une sanction levée est supprimée) ; le
		 *             snapshot `data` assure alors l'affichage.
		 */

		// Qui a fait l'action (auteur, abonné, personne qui réagit...)
		actorId: varchar("actor_id", { length: 10 }).references(
			() => profiles.id,
			{ onDelete: "cascade" },
		),

		postId: varchar("post_id", { length: 10 }).references(() => posts.id, {
			onDelete: "cascade",
		}),

		whisperId: varchar("whisper_id", { length: 10 }).references(
			() => whispers.id,
			{ onDelete: "cascade" },
		),

		profileReportId: uuid("profile_report_id").references(
			() => profileReports.id,
			{ onDelete: "cascade" },
		),

		postReportId: uuid("post_report_id").references(() => postReports.id, {
			onDelete: "cascade",
		}),

		whisperReportId: uuid("whisper_report_id").references(
			() => whisperReports.id,
			{ onDelete: "cascade" },
		),

		sanctionId: uuid("sanction_id").references(() => sanctions.id, {
			onDelete: "set null",
		}),

		badgeEntitlementId: uuid("badge_entitlement_id").references(
			() => badgesEntitlements.id,
			{ onDelete: "set null" },
		),

		levelEntitlementId: uuid("level_entitlement_id").references(
			() => levelsEntitlements.id,
			{ onDelete: "set null" },
		),

		announcementId: uuid("announcement_id").references(
			() => announcements.id,
			{ onDelete: "cascade" },
		),

		// Valeurs scalaires et snapshots propres au type (NotificationDataMap)
		data: jsonb("data")
			.$type<NotificationData>()
			.notNull()
			.default(sql`'{}'::jsonb`),

		// Idempotence : (account_id, dedupe_key) est unique quand renseigné
		dedupeKey: text("dedupe_key"),

		// null = non lue. Date de lecture plutôt qu'un booléen : on sait quand.
		readAt: timestamp("read_at"),

		// Suivi du mail associé (cf. shouldSendEmail dans shared/consts/notifications.ts)
		emailStatus: notificationEmailStatusEnum("email_status")
			.notNull()
			.default("skipped"),
		emailAttempts: integer("email_attempts").notNull().default(0),
		emailedAt: timestamp("emailed_at"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		/*
		 * Intégrité
		 */

		// post_id / whisper_id selon le type
		check(
			"notifications_subject_refs",
			sql`case
				when ${table.type}::text in ('content.post', 'interaction.reply')
					then ${table.postId} is not null and ${table.whisperId} is null
				when ${table.type}::text = 'content.whisper'
					then ${table.whisperId} is not null and ${table.postId} is null
				when ${table.type}::text in ('interaction.reaction', 'interaction.milestone')
					then num_nonnulls(${table.postId}, ${table.whisperId}) = 1
				else ${table.postId} is null and ${table.whisperId} is null
			end`,
		),

		// actor_id obligatoire pour les évènements causés par un autre profil
		check(
			"notifications_actor_ref",
			sql`case
				when ${table.type}::text in (
					'content.post', 'content.whisper',
					'interaction.reaction', 'interaction.reply',
					'relation.follower', 'relation.request'
				) then ${table.actorId} is not null
				else ${table.actorId} is null
			end`,
		),

		// Exactement un signalement pour report.*, aucun sinon
		check(
			"notifications_report_refs",
			sql`num_nonnulls(${table.profileReportId}, ${table.postReportId}, ${table.whisperReportId})
				= case when ${table.type}::text like 'report.%' then 1 else 0 end`,
		),

		// announcement_id <=> announcement.*
		check(
			"notifications_announcement_ref",
			sql`(${table.type}::text like 'announcement.%') = (${table.announcementId} is not null)`,
		),

		// sanction / badge / niveau : réservés à leur famille de types
		// (null autorisé : la ressource a pu être supprimée, cf. SET NULL)
		check(
			"notifications_entitlement_refs",
			sql`(${table.sanctionId} is null or ${table.type}::text like 'sanction.%')
				and (${table.badgeEntitlementId} is null or ${table.type}::text like 'badge.%')
				and (${table.levelEntitlementId} is null or ${table.type}::text like 'level.%')`,
		),

		/*
		 * Performances
		 */

		// Liste de la boîte de réception, paginée par date
		index("notifications_inbox_idx").on(
			table.accountId,
			table.createdAt.desc(),
		),

		// Pastille et « tout marquer comme lu » : seulement les non lues
		index("notifications_unread_idx")
			.on(table.accountId, table.profileId)
			.where(sql`${table.readAt} is null`),

		// Idempotence
		uniqueIndex("notifications_dedupe_key_idx")
			.on(table.accountId, table.dedupeKey)
			.where(sql`${table.dedupeKey} is not null`),

		// Reprise des mails en attente ou en échec
		index("notifications_email_retry_idx")
			.on(table.createdAt)
			.where(sql`${table.emailStatus}::text in ('pending', 'failed')`),

		// Index des FK : sans eux, chaque suppression de post, de profil, de
		// signalement... parcourt toute la table. Partiels : colonnes clairsemées.
		index("notifications_profile_id_idx")
			.on(table.profileId)
			.where(sql`${table.profileId} is not null`),
		index("notifications_actor_id_idx")
			.on(table.actorId)
			.where(sql`${table.actorId} is not null`),
		index("notifications_post_id_idx")
			.on(table.postId)
			.where(sql`${table.postId} is not null`),
		index("notifications_whisper_id_idx")
			.on(table.whisperId)
			.where(sql`${table.whisperId} is not null`),
		index("notifications_profile_report_id_idx")
			.on(table.profileReportId)
			.where(sql`${table.profileReportId} is not null`),
		index("notifications_post_report_id_idx")
			.on(table.postReportId)
			.where(sql`${table.postReportId} is not null`),
		index("notifications_whisper_report_id_idx")
			.on(table.whisperReportId)
			.where(sql`${table.whisperReportId} is not null`),
		index("notifications_sanction_id_idx")
			.on(table.sanctionId)
			.where(sql`${table.sanctionId} is not null`),
		index("notifications_badge_entitlement_id_idx")
			.on(table.badgeEntitlementId)
			.where(sql`${table.badgeEntitlementId} is not null`),
		index("notifications_level_entitlement_id_idx")
			.on(table.levelEntitlementId)
			.where(sql`${table.levelEntitlementId} is not null`),
		index("notifications_announcement_id_idx")
			.on(table.announcementId)
			.where(sql`${table.announcementId} is not null`),
	],
).enableRLS();

export type Notification = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
