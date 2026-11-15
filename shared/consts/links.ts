/**
 * Registre des liens reconnus par le réseau social.
 *
 * Un enregistrement = un TYPE de lien (et non un domaine) : un même domaine
 * peut porter plusieurs types (chaîne YouTube, vidéo YouTube, profil
 * Instagram, réel Instagram...) et un même type peut s'étendre sur plusieurs
 * domaines (x.com / twitter.com, youtube.com / youtu.be).
 *
 * - Profil : l'utilisateur saisit un lien, le type est détecté automatiquement.
 *   Seuls les types `kind: "profile"` sont considérés. Hors registre, c'est le
 *   domaine qui est affiché à la place du slug (cf. resolveProfileLink).
 * - Publication : l'utilisateur saisit un lien ET un titre. Sans titre, on
 *   prend le `name` déclaré ici, ou à défaut le nom de domaine
 *   (cf. getLinkInfo / resolveLinkTitle). Tous les types sont considérés.
 */

// "profile" : un compte, une chaîne, un serveur... (affichable sur un profil)
// "content" : un contenu précis (vidéo, réel, publication...), jamais sur un profil
export type LinkKind = "profile" | "content";

// "name" : slug lisible (@pseudo) -> profile_links.resource_name
// "id"   : identifiant opaque (ID de vidéo, de compte...) -> profile_links.resource_id
export type LinkSlugType = "name" | "id";

export type LinkSource = {
	// Restreint cette source à certains domaines du type (par défaut : tous).
	hosts?: readonly string[];
	// Testé sur le chemin de l'URL. Le groupe 1 est le slug, sauf si `param` est défini.
	path: RegExp;
	// Le slug est lu dans ce paramètre de requête (ex: "v" pour youtube.com/watch?v=...).
	param?: string;
};

export type LinkType = {
	id: string; // identifiant stable, stocké en base (profile_links.type, attachments.link_type)
	platform: string; // regroupe les types d'un même service (icône, recherche)
	kind: LinkKind;
	name: string; // nom déclaré : titre par défaut d'une publication
	icon: string;
	domains: readonly string[]; // sans "www." ni "m."
	slugType: LinkSlugType;
	sources: readonly LinkSource[];
	legacyIds?: readonly string[]; // anciens identifiants encore présents en base
};

/** Type enregistré en base pour un lien de profil hors registre. */
export const WEBSITE_LINK_TYPE = "website";

const simpleIcon = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

export const linkTypes: readonly LinkType[] = [
	/* ------------------------------- YouTube ------------------------------- */
	{
		id: "youtube_channel",
		platform: "youtube",
		kind: "profile",
		name: "Chaîne YouTube",
		icon: simpleIcon("youtube"),
		domains: ["youtube.com"],
		slugType: "name",
		sources: [
			{ path: /^\/(?:@|user\/|channel\/|c\/)([A-Za-z0-9._-]+)\/?$/i },
		],
	},
	{
		id: "youtube_video",
		platform: "youtube",
		kind: "content",
		name: "Vidéo YouTube",
		icon: simpleIcon("youtube"),
		domains: ["youtube.com", "youtu.be"],
		slugType: "id",
		sources: [
			{ hosts: ["youtube.com"], path: /^\/watch\/?$/i, param: "v" },
			{
				hosts: ["youtube.com"],
				path: /^\/(?:shorts|live|embed)\/([A-Za-z0-9_-]{11})\/?$/i,
			},
			{ hosts: ["youtu.be"], path: /^\/([A-Za-z0-9_-]{11})\/?$/ },
		],
	},

	/* --------------------------------- X ---------------------------------- */
	{
		id: "x_profile",
		platform: "x",
		kind: "profile",
		name: "Profil X",
		icon: simpleIcon("x"),
		domains: ["x.com", "twitter.com"],
		slugType: "name",
		sources: [{ path: /^\/([A-Za-z0-9_]+)\/?$/i }],
		legacyIds: ["twitter_profile"],
	},
	{
		id: "x_post",
		platform: "x",
		kind: "content",
		name: "Publication X",
		icon: simpleIcon("x"),
		domains: ["x.com", "twitter.com"],
		slugType: "id",
		sources: [{ path: /^\/[A-Za-z0-9_]+\/status\/(\d+)\/?$/i }],
	},

	/* -------------------------------- Bluesky ------------------------------ */
	{
		id: "bluesky_profile",
		platform: "bluesky",
		kind: "profile",
		name: "Profil Bluesky",
		icon: simpleIcon("bluesky"),
		domains: ["bsky.app"],
		slugType: "name",
		sources: [{ path: /^\/profile\/([A-Za-z0-9_.:-]+)\/?$/i }],
	},
	{
		id: "bluesky_post",
		platform: "bluesky",
		kind: "content",
		name: "Publication Bluesky",
		icon: simpleIcon("bluesky"),
		domains: ["bsky.app"],
		slugType: "id",
		sources: [
			{ path: /^\/profile\/[A-Za-z0-9_.:-]+\/post\/([A-Za-z0-9]+)\/?$/i },
		],
	},

	/* --------------------------------- Beam -------------------------------- */
	{
		id: "beam_profile",
		platform: "beam",
		kind: "profile",
		name: "Profil Beam",
		icon: "https://beam.ejnalo.me/favicon.ico",
		domains: ["beam.ejnalo.me"],
		slugType: "name",
		sources: [{ path: /^\/@([A-Za-z0-9_.-]+)\/?$/i }],
	},

	/* ------------------------------- Instagram ----------------------------- */
	{
		id: "instagram_profile",
		platform: "instagram",
		kind: "profile",
		name: "Profil Instagram",
		icon: simpleIcon("instagram"),
		domains: ["instagram.com"],
		slugType: "name",
		sources: [{ path: /^\/([A-Za-z0-9._]+)\/?$/i }],
	},
	{
		id: "instagram_reel",
		platform: "instagram",
		kind: "content",
		name: "Réel Instagram",
		icon: simpleIcon("instagram"),
		domains: ["instagram.com"],
		slugType: "id",
		sources: [{ path: /^\/reels?\/([A-Za-z0-9_-]+)\/?$/i }],
	},
	{
		id: "instagram_post",
		platform: "instagram",
		kind: "content",
		name: "Publication Instagram",
		icon: simpleIcon("instagram"),
		domains: ["instagram.com"],
		slugType: "id",
		sources: [{ path: /^\/p\/([A-Za-z0-9_-]+)\/?$/i }],
	},

	/* -------------------------------- Facebook ----------------------------- */
	{
		id: "facebook_profile",
		platform: "facebook",
		kind: "profile",
		name: "Profil Facebook",
		icon: simpleIcon("facebook"),
		domains: ["facebook.com"],
		slugType: "name",
		sources: [{ path: /^\/([A-Za-z0-9._-]+)\/?$/i }],
	},

	/* --------------------------------- GitHub ------------------------------ */
	{
		id: "github_profile",
		platform: "github",
		kind: "profile",
		name: "Profil GitHub",
		icon: simpleIcon("github"),
		domains: ["github.com"],
		slugType: "name",
		sources: [{ path: /^\/([A-Za-z0-9-]+)\/?$/i }],
	},
	{
		id: "github_repo",
		platform: "github",
		kind: "content",
		name: "Repo GitHub",
		icon: simpleIcon("github"),
		domains: ["github.com"],
		slugType: "name",
		sources: [{ path: /^\/([A-Za-z0-9-]+\/[A-Za-z0-9._-]+)\/?$/i }],
	},

	/* --------------------------------- Twitch ------------------------------ */
	{
		id: "twitch_profile",
		platform: "twitch",
		kind: "profile",
		name: "Chaîne Twitch",
		icon: simpleIcon("twitch"),
		domains: ["twitch.tv"],
		slugType: "name",
		sources: [{ path: /^\/([A-Za-z0-9_]+)\/?$/i }],
	},

	/* --------------------------------- Discord ----------------------------- */
	{
		id: "discord_profile",
		platform: "discord",
		kind: "profile",
		name: "Profil Discord",
		icon: simpleIcon("discord"),
		domains: ["discord.com"],
		slugType: "id",
		sources: [{ path: /^\/users\/([A-Za-z0-9_-]+)\/?$/i }],
	},
	{
		id: "discord_invite",
		platform: "discord",
		kind: "profile",
		name: "Serveur Discord",
		icon: simpleIcon("discord"),
		domains: ["discord.gg", "discord.com"],
		slugType: "id",
		sources: [
			{ hosts: ["discord.gg"], path: /^\/([A-Za-z0-9_-]+)\/?$/i },
			{
				hosts: ["discord.com"],
				path: /^\/invite\/([A-Za-z0-9_-]+)\/?$/i,
			},
		],
	},

	/* --------------------------------- Reddit ------------------------------ */
	{
		id: "reddit_profile",
		platform: "reddit",
		kind: "profile",
		name: "Profil Reddit",
		icon: simpleIcon("reddit"),
		domains: ["reddit.com"],
		slugType: "name",
		sources: [{ path: /^\/(?:user|u)\/([A-Za-z0-9_-]+)\/?$/i }],
	},
	{
		id: "reddit_post",
		platform: "reddit",
		kind: "content",
		name: "Publication Reddit",
		icon: simpleIcon("reddit"),
		domains: ["reddit.com"],
		slugType: "id",
		sources: [
			{
				path: /^\/r\/[A-Za-z0-9_]+\/comments\/([A-Za-z0-9]+)(?:\/[^/]*)?\/?$/i,
			},
		],
	},

	/* ------------------------------- SoundCloud ---------------------------- */
	{
		id: "soundcloud_profile",
		platform: "soundcloud",
		kind: "profile",
		name: "Profil SoundCloud",
		icon: simpleIcon("soundcloud"),
		domains: ["soundcloud.com"],
		slugType: "name",
		sources: [{ path: /^\/([A-Za-z0-9_-]+)\/?$/i }],
	},

	/* --------------------------------- Spotify ----------------------------- */
	{
		id: "spotify_profile",
		platform: "spotify",
		kind: "profile",
		name: "Profil Spotify",
		icon: simpleIcon("spotify"),
		domains: ["open.spotify.com", "spotify.com"],
		slugType: "id",
		sources: [{ path: /^\/user\/([A-Za-z0-9_-]+)\/?$/i }],
	},
	{
		id: "spotify_track",
		platform: "spotify",
		kind: "content",
		name: "Titre Spotify",
		icon: simpleIcon("spotify"),
		domains: ["open.spotify.com", "spotify.com"],
		slugType: "id",
		sources: [
			{ path: /^\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]+)\/?$/i },
		],
	},

	/* --------------------------------- TikTok ------------------------------ */
	{
		id: "tiktok_profile",
		platform: "tiktok",
		kind: "profile",
		name: "Profil TikTok",
		icon: simpleIcon("tiktok"),
		domains: ["tiktok.com"],
		slugType: "name",
		sources: [{ path: /^\/@([A-Za-z0-9._]+)\/?$/i }],
	},
	{
		id: "tiktok_video",
		platform: "tiktok",
		kind: "content",
		name: "Vidéo TikTok",
		icon: simpleIcon("tiktok"),
		domains: ["tiktok.com"],
		slugType: "id",
		sources: [{ path: /^\/@[A-Za-z0-9._]+\/video\/(\d+)\/?$/i }],
	},

	/* --------------------------------- Pixiv ------------------------------- */
	{
		id: "pixiv_profile",
		platform: "pixiv",
		kind: "profile",
		name: "Profil Pixiv",
		icon: simpleIcon("pixiv"),
		domains: ["pixiv.me", "pixiv.net"],
		slugType: "name",
		sources: [{ path: /^\/users\/(\d+)\/?$/i }],
	},

	/* ------------------------------ Bulle, Darflen ------------------------- */
	{
		id: "bulle_profile",
		platform: "bulle",
		kind: "profile",
		name: "Profil Bulle",
		icon: "https://www.bulle.media/favicon.ico",
		domains: ["bulle.media"],
		slugType: "name",
		sources: [{ path: /^\/u\/([A-Za-z0-9_-]+)\/?$/i }],
	},
	{
		id: "darflen_profile",
		platform: "darflen",
		kind: "profile",
		name: "Profil Darflen",
		icon: "https://static.darflen.com/img/favicons/favicon.ico",
		domains: ["darflen.com"],
		slugType: "name",
		sources: [{ path: /^\/users\/([A-Za-z0-9_-]+)\/?$/i }],
	},
];

/* -------------------------------------------------------------------------- */
/*  Recherche dans le registre                                                */
/* -------------------------------------------------------------------------- */

export const normalizeHostname = (hostname: string): string =>
	hostname.toLowerCase().replace(/^(?:www|m|mobile)\./, "");

/** Un type par son identifiant ("youtube_video"), anciens identifiants compris. */
export const getLinkTypeById = (id: string): LinkType | null =>
	linkTypes.find((type) => type.id === id || type.legacyIds?.includes(id)) ??
	null;

export type LinkTypeFilter = {
	platform?: string; // "youtube"
	kind?: LinkKind; // "content"
	domain?: string; // "youtu.be"
};

/** Tous les types correspondant au filtre, ex: { platform: "youtube", kind: "content" }. */
export const findLinkTypes = (filter: LinkTypeFilter = {}): LinkType[] => {
	const domain = filter.domain ? normalizeHostname(filter.domain) : null;

	return linkTypes.filter(
		(type) =>
			(!filter.platform || type.platform === filter.platform) &&
			(!filter.kind || type.kind === filter.kind) &&
			(!domain || type.domains.includes(domain)),
	);
};

export const getLinkTypesByPlatform = (platform: string): LinkType[] =>
	findLinkTypes({ platform });

export const getLinkTypesByDomain = (domain: string): LinkType[] =>
	findLinkTypes({ domain });

/* -------------------------------------------------------------------------- */
/*  Analyse d'une URL                                                         */
/* -------------------------------------------------------------------------- */

const parseUrl = (url: string): URL | null => {
	try {
		return new URL(url);
	} catch {
		return null;
	}
};

const PARAM_SLUG = /^[A-Za-z0-9_-]{1,128}$/;

const extractSlug = (source: LinkSource, url: URL): string | null => {
	if (source.param) {
		if (!source.path.test(url.pathname)) return null;

		const value = url.searchParams.get(source.param);
		return value && PARAM_SLUG.test(value) ? value : null;
	}

	return source.path.exec(url.pathname)?.[1] ?? null;
};

export type LinkMatch = { type: LinkType; slug: string };

/** Nom de domaine d'un lien, sans "www." (null si l'URL est invalide). */
export const getLinkHostname = (url: string): string | null => {
	const parsed = parseUrl(url);
	return parsed ? normalizeHostname(parsed.hostname) : null;
};

/**
 * Cherche le type d'un lien. `kind` restreint la recherche (un lien de profil
 * ne peut pas être une vidéo).
 */
export const matchLink = (
	url: string,
	options: { kind?: LinkKind } = {},
): LinkMatch | null => {
	const parsed = parseUrl(url);
	if (!parsed) return null;

	const hostname = normalizeHostname(parsed.hostname);

	for (const type of linkTypes) {
		if (options.kind && type.kind !== options.kind) continue;
		if (!type.domains.includes(hostname)) continue;

		for (const source of type.sources) {
			if (source.hosts && !source.hosts.includes(hostname)) continue;

			const slug = extractSlug(source, parsed);
			if (slug) return { type, slug };
		}
	}

	return null;
};

/* -------------------------------------------------------------------------- */
/*  Profil                                                                    */
/* -------------------------------------------------------------------------- */

export type ProfileLinkInfo = {
	type: string; // id du registre, ou "website"
	name: string; // nom déclaré, ou nom de domaine hors registre
	resourceId?: string;
	resourceName?: string;
};

/**
 * Détecte automatiquement le profil derrière un lien. Hors registre, le
 * domaine sert de nom et il n'y a pas de slug. Null si l'URL est invalide.
 */
export const resolveProfileLink = (url: string): ProfileLinkInfo | null => {
	const hostname = getLinkHostname(url);
	if (!hostname) return null;

	const match = matchLink(url, { kind: "profile" });

	if (!match) return { type: WEBSITE_LINK_TYPE, name: hostname };

	return {
		type: match.type.id,
		name: match.type.name,
		...(match.type.slugType === "id"
			? { resourceId: match.slug }
			: { resourceName: match.slug }),
	};
};

/* -------------------------------------------------------------------------- */
/*  Publication                                                               */
/* -------------------------------------------------------------------------- */

export type LinkInfo = {
	hostname: string;
	type: LinkType | null;
	slug: string | null;
	title: string; // nom déclaré, ou nom de domaine hors registre
};

export const getLinkInfo = (url: string): LinkInfo => {
	const hostname = getLinkHostname(url) ?? url;
	const match = matchLink(url);

	return {
		hostname,
		type: match?.type ?? null,
		slug: match?.slug ?? null,
		title: match?.type.name ?? hostname,
	};
};

/** Titre d'un lien de publication : celui saisi, sinon le nom déclaré, sinon le domaine. */
export const resolveLinkTitle = (
	title: string | null | undefined,
	url: string,
): string => title?.trim() || getLinkInfo(url).title;
