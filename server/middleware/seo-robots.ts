import { useDb } from "#server/db";
import { posts } from "~~/server/db/schema/interactions";
import { profiles } from "~~/server/db/schema/profiles";
import { privacySettings } from "~~/server/db/schema/settings";
import { and, eq } from "drizzle-orm";

import {
	postIndexableCondition,
	profileIndexableCondition,
	ROBOTS_INDEX,
	ROBOTS_NOINDEX,
} from "#server/utils/seo";
import { normalizeId } from "#server/utils/normalizers/ids";

/*
 * Directive d'indexation des profils (/@nom) et des publications (/posts/id).
 *
 * Envoyée en en-tête X-Robots-Tag, identique pour tous les visiteurs (pas de
 * cloaking) et décidée côté serveur, car la majorité de l'auteur n'est pas
 * exposée par l'API quand sa date de naissance est privée.
 * Les critères sont dans server/utils/seo.ts. En cas d'erreur ou de cible
 * introuvable : noindex.
 *
 * Les sous-pages (/@nom/badges, /posts/id/statistics, …) ne sont pas
 * concernées par cette étape.
 */

const PROFILE_PATH = /^\/@([^/?#]+)\/?$/;
const POST_PATH = /^\/posts\/([^/?#]+)\/?$/;

export default defineEventHandler(async (event) => {
	if (event.method !== "GET" && event.method !== "HEAD") return;

	const path = event.path.split("?")[0] ?? "";

	const profileMatch = PROFILE_PATH.exec(path);
	const postMatch = POST_PATH.exec(path);

	if (!profileMatch && !postMatch) return;

	let indexable = false;

	try {
		const db = useDb(event);

		if (profileMatch) {
			const name = decodeURIComponent(profileMatch[1]!);

			const [row] = await db
				.select({ id: profiles.id })
				.from(profiles)
				.innerJoin(
					privacySettings,
					eq(privacySettings.accountId, profiles.accountId),
				)
				.where(and(eq(profiles.name, name), profileIndexableCondition()))
				.limit(1);

			indexable = !!row;
		} else {
			const postId = normalizeId(decodeURIComponent(postMatch![1]!));

			if (postId) {
				const [row] = await db
					.select({ id: posts.id })
					.from(posts)
					.innerJoin(profiles, eq(profiles.id, posts.profileId))
					.where(and(eq(posts.id, postId), postIndexableCondition(db)))
					.limit(1);

				indexable = !!row;
			}
		}
	} catch {
		indexable = false;
	}

	setResponseHeader(
		event,
		"X-Robots-Tag",
		indexable ? ROBOTS_INDEX : ROBOTS_NOINDEX,
	);
});
