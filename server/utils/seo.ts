import { levelsEntitlements } from "~~/server/db/schema/entitlements";
import { posts, postsFlags } from "~~/server/db/schema/interactions";
import { profiles } from "~~/server/db/schema/profiles";
import { privacySettings } from "~~/server/db/schema/settings";
import { and, eq, inArray, isNotNull, notExists, sql } from "drizzle-orm";

/*
 * Règles de référencement (index only).
 *
 * Source de vérité unique : tout ce qui n'est pas explicitement autorisé ici
 * n'est pas indexé. Les conditions sont exposées sous forme de fragments SQL
 * pour pouvoir être réutilisées telles quelles (sitemaps, étape suivante).
 *
 * Profil indexable :
 *   - niveau 5 (vérifié) ou 9 (fondateur)
 *   - majeur (date de naissance renseignée et >= 18 ans)
 *   - profil public (visibilité "everyone" ou "outside")
 *
 * Publication indexable :
 *   - aucun flag NFE ni AI
 *   - auteur de niveau >= 3
 *   - visibilité "everyone" ou "outside"
 *
 * Une page indexable est servie en "index, nofollow" : les liens présents
 * dans les profils et les publications (contenu utilisateur) ne sont jamais
 * suivis.
 *
 * Tout autre contenu généré par les utilisateurs (sous-pages de profil et de
 * publication, tags, recherche, API, pièces jointes, chuchotements, avatars…)
 * est exclu : "noindex, nofollow" (voir USER_CONTENT_NOINDEX_PATHS).
 */

export const INDEXABLE_PROFILE_LEVELS = [5, 9];
export const INDEXABLE_POST_MIN_AUTHOR_LEVEL = 3;
export const ADULT_AGE = 18;

export const PUBLIC_VISIBILITIES: ("everyone" | "outside")[] = [
	"everyone",
	"outside",
];

export const BLOCKING_POST_FLAGS: ("NFE" | "AI")[] = ["NFE", "AI"];

export const ROBOTS_INDEX = "index, nofollow";
export const ROBOTS_NOINDEX = "noindex, nofollow";

// Pages et routes de contenu utilisateur qui ne sont jamais indexables.
// Les pages indexables (/@nom et /posts/id, sans sous-chemin) sont gérées à
// part, au cas par cas, par server/middleware/seo-robots.ts.
export const USER_CONTENT_NOINDEX_PATHS: RegExp[] = [
	// Sous-pages d'un profil ou d'une publication (badges, statistiques, …)
	/^\/@[^/]+\/.+/,
	/^\/posts\/[^/]+\/.+/,
	// Découverte, tags et recherche
	/^\/discover(\/|$)/,
	/^\/search\/?$/,
	// API : profils, publications, chuchotements, pièces jointes, fils, recherche
	/^\/api\/v1\/(users|posts|whispers|attachments|feed|search)(\/|$)/,
];

/*
 * Niveau effectif d'un profil. `profiles.level` n'est jamais mis à jour après
 * l'inscription (2) : le vrai niveau vient des entitlements actifs, comme dans
 * getLevelFromEntitlements (server/utils/auth.ts) :
 *   - s'il existe un niveau actif < 3 (restriction), le plus bas l'emporte ;
 *   - sinon le plus haut niveau actif >= 3 ;
 *   - sinon 2.
 */
const activeLevels = (extra: ReturnType<typeof sql>) => sql`(
	SELECT ${levelsEntitlements.levelId} FROM ${levelsEntitlements}
	WHERE ${levelsEntitlements.profileId} = ${profiles.id}
		AND NOT ${levelsEntitlements.revoked}
		AND ${levelsEntitlements.enabled}
		AND (${levelsEntitlements.expiresAt} IS NULL OR ${levelsEntitlements.expiresAt} > now())
		AND ${extra}
)`;

export const effectiveProfileLevel = () => sql<number>`COALESCE(
	(SELECT MIN(l) FROM ${activeLevels(sql`${levelsEntitlements.levelId} < 3`)} AS t(l)),
	(SELECT MAX(l) FROM ${activeLevels(sql`${levelsEntitlements.levelId} >= 3`)} AS t(l)),
	2
)`;

// `profiles` doit être joint à `privacySettings` (accountId).
export const profileIndexableCondition = () =>
	and(
		sql`${effectiveProfileLevel()} IN (${sql.join(
			INDEXABLE_PROFILE_LEVELS.map((level) => sql`${level}`),
			sql`, `,
		)})`,
		isNotNull(profiles.birthday),
		sql`${profiles.birthday} <= (CURRENT_DATE - make_interval(years => ${ADULT_AGE}))`,
		inArray(privacySettings.profileVisibility, PUBLIC_VISIBILITIES),
	);

// `posts` doit être joint à `profiles` (auteur).
export const postIndexableCondition = (db: {
	select: (...args: any[]) => any;
}) =>
	and(
		inArray(posts.visibility, PUBLIC_VISIBILITIES),
		sql`${effectiveProfileLevel()} >= ${INDEXABLE_POST_MIN_AUTHOR_LEVEL}`,
		notExists(
			db
				.select({ one: sql`1` })
				.from(postsFlags)
				.where(
					and(
						eq(postsFlags.postId, posts.id),
						inArray(postsFlags.type, BLOCKING_POST_FLAGS),
					),
				),
		),
	);
