/*
 * Quêtes de Noël : distribution des badges de récompense.
 *
 * Comme retention.ts, ce fichier ne dépend de rien : il fabrique le SQL et
 * l'exécute via la fonction `query` qu'on lui injecte (voir index.ts).
 *
 * Les points ne sont PAS recalculés depuis les publications, pensées, etc. :
 * les pensées sont purgées au bout de 24 h (cf. retention.ts), la source de
 * vérité est donc uniquement la table `christmas_quest_completions`.
 *
 * Toute la distribution est faite par UNE SEULE requête SQL (CTE) : avec le
 * pooler Supabase en mode "transaction", deux requêtes successives ne sont
 * pas garanties de partager la même transaction. Une requête = tout ou rien.
 */

import type { Query } from "./retention.ts";

export const CAMPAIGN_YEAR = 2026;

/*
 * Fenêtre dans laquelle une distribution réelle est autorisée. Elle protège de :
 *  - un déclenchement manuel en dehors de la période ;
 *  - le cron annuel (`59 23 24 12 *`) qui se redéclencherait en 2027 et
 *    redonnerait des badges à partir des quêtes de 2026.
 * Fin au 1er janvier : laisse une marge si Cloudflare retarde l'exécution.
 */
const WINDOW_START = Date.UTC(CAMPAIGN_YEAR, 11, 24);
const WINDOW_END = Date.UTC(CAMPAIGN_YEAR + 1, 0, 1);

/** Miroir de LEVEL_REWARDS (shared/models/campaigns/christmas.ts). */
export const POINTS_PER_LEVEL = {
	secondary: 2,
	normal: 5,
	super: 8,
	ultra: 12,
	final: 15,
} as const;

export interface BadgeReward {
	badgeId: string;

	/** Seuil de points à partir duquel le badge est donné. */
	minPoints: number;

	/** Durée de validité en années ; null = permanent. */
	years: number | null;

	/** Nom de l'attribution (même convention que server/jobs/signup.ts). */
	name: string;
}

/*
 * 100 pts : Prestige (1 an) + Cyber Santa (1 an) + Premier Noël
 *  75 pts :                   Cyber Santa (1 an) + Premier Noël
 *  50 pts :                                        Premier Noël
 *
 * Les paliers sont cumulatifs : chaque badge est donné dès que son seuil est
 * atteint, ce qui donne exactement les trois listes ci-dessus.
 */
export const BADGE_REWARDS: BadgeReward[] = [
	{
		badgeId: "prestige",
		minPoints: 100,
		years: 1,
		name: "Badge Prestige Offert",
	},
	{
		badgeId: "cyber_santa",
		minPoints: 75,
		years: 1,
		name: "Badge Cyber Santa Offert",
	},
	{
		badgeId: "premier_noel",
		minPoints: 50,
		years: null,
		name: "Badge Premier Noël Offert",
	},
];

/*
 * La raison sert aussi de clé d'idempotence : un profil qui a déjà ce badge
 * avec cette raison (donc déjà distribué cette année) n'est pas re-servi.
 */
const reasonFor = (reward: BadgeReward) =>
	`Vous avez cumulé au moins ${reward.minPoints} points aux Quêtes de Noël ${CAMPAIGN_YEAR}.`;

function rewardsJson(): string {
	return JSON.stringify(
		BADGE_REWARDS.map((reward) => ({
			badge_id: reward.badgeId,
			min_points: reward.minPoints,
			years: reward.years,
			name: reward.name,
			reason: reasonFor(reward),
		})),
	);
}

function pointsCase(): string {
	const branches = Object.entries(POINTS_PER_LEVEL)
		.map(([level, points]) => `WHEN '${level}' THEN ${Number(points)}`)
		.join(" ");

	return `CASE q.level::text ${branches} ELSE 0 END`;
}

// $1 = JSON des récompenses (rewardsJson)
const GRANTABLE_CTES =
	`rewards AS (` +
	`SELECT * FROM jsonb_to_recordset($1::jsonb) ` +
	`AS r(badge_id text, min_points int, years int, name text, reason text)` +
	`), ` +
	// DISTINCT : une quête ne compte qu'une fois par profil, même si la table
	// contenait un doublon (elle n'a pas de contrainte d'unicité).
	`points AS (` +
	`SELECT c.profile_id, sum(${pointsCase()})::int AS points ` +
	`FROM (SELECT DISTINCT profile_id, quest_id FROM public.christmas_quest_completions) c ` +
	`JOIN public.christmas_quests q ON q.day = c.quest_id ` +
	`GROUP BY c.profile_id` +
	`), ` +
	`to_grant AS (` +
	`SELECT p.profile_id, r.badge_id, r.name, r.reason, r.years ` +
	`FROM points p ` +
	`JOIN rewards r ON p.points >= r.min_points ` +
	`JOIN public.profiles pr ON pr.id = p.profile_id ` +
	`WHERE NOT EXISTS (` +
	`SELECT 1 FROM public.badges_entitlements e ` +
	`WHERE e.profile_id = p.profile_id AND e.badge_id = r.badge_id ` +
	`AND e.reason = r.reason)` +
	`)`;

export const COUNT_SQL =
	`WITH ${GRANTABLE_CTES} ` +
	`SELECT badge_id, count(*)::int AS n FROM to_grant GROUP BY badge_id`;

export const GRANT_SQL =
	`WITH ${GRANTABLE_CTES}, ` +
	`inserted AS (` +
	`INSERT INTO public.badges_entitlements (profile_id, badge_id, name, reason, expires_at) ` +
	`SELECT profile_id, badge_id, name, reason, ` +
	`CASE WHEN years IS NULL THEN NULL ELSE now() + make_interval(years => years) END ` +
	`FROM to_grant ` +
	`RETURNING id, profile_id, badge_id, reason, expires_at` +
	`), ` +
	// Même notification que POST /entitlements/badges (type badge.granted).
	// dedupe_key (unique par compte) : un compte peut avoir plusieurs profils,
	// d'où le profil dans la clé.
	`notified AS (` +
	`INSERT INTO public.notifications ` +
	`(account_id, profile_id, type, badge_entitlement_id, data, dedupe_key) ` +
	`SELECT pr.account_id, i.profile_id, 'badge.granted'::notification_type, i.id, ` +
	`jsonb_build_object(` +
	`'badgeId', i.badge_id, 'badgeName', b.name, 'reason', i.reason, ` +
	`'expiresAt', to_char(i.expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')), ` +
	`'christmas-${CAMPAIGN_YEAR}:' || i.profile_id || ':' || i.badge_id ` +
	`FROM inserted i ` +
	`JOIN public.profiles pr ON pr.id = i.profile_id ` +
	`JOIN public.badges b ON b.id = i.badge_id ` +
	`ON CONFLICT DO NOTHING ` +
	`RETURNING 1` +
	`) ` +
	`SELECT badge_id, count(*)::int AS n, ` +
	`(SELECT count(*)::int FROM notified) AS notified ` +
	`FROM inserted GROUP BY badge_id`;

export const MISSING_BADGES_SQL =
	`SELECT id FROM public.badges WHERE id = ANY($1::text[])`;

export interface ChristmasResult {
	status: "granted" | "counted" | "skipped";
	reason?: string;

	/** Nombre de badges (attribués, ou qui le seraient en dry-run) par badge. */
	byBadge: Record<string, number>;
	total: number;
}

export interface ChristmasOptions {
	query: Query;
	dryRun: boolean;

	/** Heure de déclenchement du cron (controller.scheduledTime), en ms. */
	scheduledTime: number;

	log?: (entry: Record<string, unknown>) => void;
}

export async function runChristmas(
	options: ChristmasOptions,
): Promise<ChristmasResult> {
	const { query, dryRun, scheduledTime, log = () => {} } = options;

	const inWindow = scheduledTime >= WINDOW_START && scheduledTime < WINDOW_END;

	if (!dryRun && !inWindow) {
		const result: ChristmasResult = {
			status: "skipped",
			reason: `hors de la période de distribution (${new Date(WINDOW_START).toISOString()} → ${new Date(WINDOW_END).toISOString()})`,
			byBadge: {},
			total: 0,
		};

		log({ job: "christmas", ...result, dryRun });
		return result;
	}

	// Les badges doivent exister (FK) : on échoue clairement plutôt que de
	// laisser Postgres rejeter la requête de distribution.
	const wanted = BADGE_REWARDS.map((reward) => reward.badgeId);
	const existing = new Set(
		(await query(MISSING_BADGES_SQL, [`{${wanted.join(",")}}`])).map((row) =>
			String(row.id),
		),
	);
	const missing = wanted.filter((id) => !existing.has(id));

	if (missing.length) {
		throw new Error(
			`Badges absents de la table badges : ${missing.join(", ")} (voir server/db/seeds/christmas-badges.sql)`,
		);
	}

	const rows = await query(dryRun ? COUNT_SQL : GRANT_SQL, [rewardsJson()]);

	const byBadge: Record<string, number> = {};
	for (const row of rows) byBadge[String(row.badge_id)] = Number(row.n ?? 0);

	const result: ChristmasResult = {
		status: dryRun ? "counted" : "granted",
		byBadge,
		total: Object.values(byBadge).reduce((sum, n) => sum + n, 0),
	};

	log({ job: "christmas", ...result, dryRun });
	return result;
}
