import { useDb } from "#server/db";
import { posts } from "~~/server/db/schema/interactions";
import { profiles } from "~~/server/db/schema/profiles";
import { privacySettings } from "~~/server/db/schema/settings";
import { and, eq } from "drizzle-orm";

import type { H3Event } from "h3";

/*
 * Aperçus de liens (Discord, Slack, Telegram, X, etc.).
 *
 * Pour ces robots uniquement, on répond directement avec une page HTML
 * minimale contenant les balises meta : pas de SSR Nuxt, pas de session,
 * pas de listes de posts/abonnés, une seule requête SQL.
 * Les visiteurs et les moteurs de recherche passent par le rendu normal.
 *
 * Confidentialité : le contenu n'est exposé que s'il est visible par un
 * visiteur anonyme (visibilité "everyone" ou "outside"). Sinon, aperçu
 * générique.
 */

const PREVIEW_BOTS =
	/discordbot|twitterbot|facebookexternalhit|facebot|slackbot|slack-imgproxy|telegrambot|whatsapp|linkedinbot|skypeuripreview|embedly|mastodon|bluesky|signal|redditbot|pinterestbot|iframely/i;

const PROFILE_PATH = /^\/@([^/?#]+)\/?$/;
const POST_PATH = /^\/posts\/([^/?#]+)\/?$/;

const SITE_NAME = "Ademyst";
const THEME_COLOR = "#ff7050";

// Visible par un visiteur anonyme ?
const isPublic = (visibility: string | null | undefined) =>
	visibility === "everyone" || visibility === "outside";

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

const truncate = (value: string, max: number) => {
	const clean = value.replace(/\s+/g, " ").trim();

	return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

type Meta = {
	title: string;
	description: string;
	url: string;
	image: string;
	type: "profile" | "article" | "website";
	imageAlt?: string;
};

const render = (m: Meta) => {
	const t = escapeHtml(m.title);
	const d = escapeHtml(m.description);
	const u = escapeHtml(m.url);
	const i = escapeHtml(m.image);

	return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta name="theme-color" content="${THEME_COLOR}">
<link rel="canonical" href="${u}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="fr_FR">
<meta property="og:type" content="${m.type}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${i}">
${m.imageAlt ? `<meta property="og:image:alt" content="${escapeHtml(m.imageAlt)}">\n` : ""}<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
</head>
<body><a href="${u}">${t}</a></body>
</html>`;
};

const send = (event: H3Event, meta: Meta) => {
	setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
	// Les aperçus peuvent être légèrement périmés : on soulage la base.
	setResponseHeader(
		event,
		"Cache-Control",
		"public, max-age=300, s-maxage=300, stale-while-revalidate=600",
	);
	setResponseHeader(event, "Vary", "User-Agent");

	return render(meta);
};

export default defineEventHandler(async (event) => {
	if (event.method !== "GET" && event.method !== "HEAD") return;

	const ua = getRequestHeader(event, "user-agent") ?? "";

	if (!PREVIEW_BOTS.test(ua)) return;

	const path = event.path.split("?")[0] ?? "";

	const profileMatch = PROFILE_PATH.exec(path);
	const postMatch = POST_PATH.exec(path);

	if (!profileMatch && !postMatch) return;

	const appUrl = (useRuntimeConfig(event).public.appUrl as string).replace(
		/\/$/,
		"",
	);
	const db = useDb(event);

	const defaultImage = `${appUrl}/images/default_avatar.png`;

	/* ------------------------------ Profil ------------------------------ */
	if (profileMatch) {
		let name: string;

		try {
			name = decodeURIComponent(profileMatch[1]!);
		} catch {
			return;
		}

		const [row] = await db
			.select({
				name: profiles.name,
				displayName: profiles.displayName,
				bio: profiles.bio,
				visibility: privacySettings.profileVisibility,
			})
			.from(profiles)
			.leftJoin(
				privacySettings,
				eq(privacySettings.accountId, profiles.accountId),
			)
			.where(eq(profiles.name, name))
			.limit(1);

		// Profil inconnu : le rendu normal gère la 404.
		if (!row) return;

		const url = `${appUrl}/@${encodeURIComponent(row.name)}`;
		const visible = isPublic(row.visibility);

		return send(event, {
			type: "profile",
			url,
			title: visible
				? `${row.displayName || row.name} (@${row.name}) | ${SITE_NAME}`
				: `@${row.name} | ${SITE_NAME}`,
			description: visible
				? truncate(row.bio || `Profil de @${row.name} sur ${SITE_NAME}.`, 200)
				: `Profil de @${row.name} sur ${SITE_NAME}.`,
			image: visible
				? `${appUrl}/api/v1/users/${encodeURIComponent(row.name)}/avatar.webp`
				: defaultImage,
			imageAlt: visible ? `Avatar de @${row.name}` : undefined,
		});
	}

	/* ---------------------------- Publication --------------------------- */
	const postId = decodeURIComponent(postMatch![1]!);

	const [row] = await db
		.select({
			id: posts.id,
			content: posts.content,
			visibility: posts.visibility,
			authorName: profiles.name,
			authorDisplayName: profiles.displayName,
			profileVisibility: privacySettings.profileVisibility,
		})
		.from(posts)
		.innerJoin(profiles, eq(profiles.id, posts.profileId))
		.leftJoin(
			privacySettings,
			eq(privacySettings.accountId, profiles.accountId),
		)
		.where(eq(posts.id, postId))
		.limit(1);

	if (!row) return;

	const url = `${appUrl}/posts/${encodeURIComponent(row.id)}`;

	// Le contenu exige que la publication ET le profil de l'auteur soient
	// visibles par un anonyme (même règle que l'API).
	const visible =
		isPublic(row.visibility) && isPublic(row.profileVisibility);

	const author = row.authorDisplayName || `@${row.authorName}`;

	return send(event, {
		type: "article",
		url,
		title: visible
			? `Publication de ${author} | ${SITE_NAME}`
			: `Publication | ${SITE_NAME}`,
		description: visible
			? truncate(row.content, 200)
			: `Une publication sur ${SITE_NAME}.`,
		image: visible
			? `${appUrl}/api/v1/users/${encodeURIComponent(row.authorName)}/avatar.webp`
			: defaultImage,
		imageAlt: visible ? `Avatar de @${row.authorName}` : undefined,
	});
});