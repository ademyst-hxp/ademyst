import { posts } from "~~/server/db/schema/interactions";
import { profiles } from "~~/server/db/schema/profiles";
import { privacySettings } from "~~/server/db/schema/settings";
import { asc, eq, sql } from "drizzle-orm";

import { useDb } from "#server/db";
import { postIndexableCondition, profileIndexableCondition } from "#server/utils/seo";

import type { H3Event } from "h3";

/*
 * Sitemaps dynamiques.
 *
 * Ils n'exposent que ce que server/utils/seo.ts déclare indexable : mêmes
 * conditions SQL que l'en-tête X-Robots-Tag (server/middleware/seo-robots.ts),
 * donc aucune URL du sitemap n'est servie en noindex. Rien n'est écrit en base
 * ni en cache applicatif : chaque requête reflète l'état courant.
 *
 *   /sitemap.xml                  index des sitemaps
 *   /sitemaps/profiles-<n>.xml    profils indexables
 *   /sitemaps/posts-<n>.xml       publications indexables
 *
 * Un sitemap est limité à 50 000 URLs : on découpe par pages de SITEMAP_PAGE_SIZE.
 */

export const SITEMAP_PAGE_SIZE = 5000;

export type SitemapKind = "profiles" | "posts";

const escapeXml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

export const getAppUrl = (event: H3Event) =>
	(useRuntimeConfig(event).public.appUrl as string).replace(/\/$/, "");

export const sendXml = (event: H3Event, xml: string) => {
	setResponseHeader(event, "Content-Type", "application/xml; charset=utf-8");
	// Les sitemaps sont lus par des robots : une heure de cache soulage la base.
	setResponseHeader(
		event,
		"Cache-Control",
		"public, max-age=600, s-maxage=3600, stale-while-revalidate=3600",
	);

	return xml;
};

const countIndexable = async (event: H3Event, kind: SitemapKind) => {
	const db = useDb(event);

	if (kind === "profiles") {
		const [row] = await db
			.select({ total: sql<number>`count(*)::int` })
			.from(profiles)
			.innerJoin(
				privacySettings,
				eq(privacySettings.accountId, profiles.accountId),
			)
			.where(profileIndexableCondition());

		return row?.total ?? 0;
	}

	const [row] = await db
		.select({ total: sql<number>`count(*)::int` })
		.from(posts)
		.innerJoin(profiles, eq(profiles.id, posts.profileId))
		.where(postIndexableCondition(db));

	return row?.total ?? 0;
};

export const renderSitemapIndex = async (event: H3Event) => {
	const appUrl = getAppUrl(event);
	const kinds: SitemapKind[] = ["profiles", "posts"];

	const entries: string[] = [];

	for (const kind of kinds) {
		const total = await countIndexable(event, kind);
		const pages = Math.ceil(total / SITEMAP_PAGE_SIZE);

		for (let page = 1; page <= pages; page++) {
			entries.push(
				`<sitemap><loc>${escapeXml(`${appUrl}/sitemaps/${kind}-${page}.xml`)}</loc></sitemap>`,
			);
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>`;
};

// Renvoie null si la page n'existe pas (hors bornes).
export const renderSitemapPage = async (
	event: H3Event,
	kind: SitemapKind,
	page: number,
) => {
	const db = useDb(event);
	const appUrl = getAppUrl(event);
	const offset = (page - 1) * SITEMAP_PAGE_SIZE;

	let urls: string[];

	if (kind === "profiles") {
		const rows = await db
			.select({ name: profiles.name })
			.from(profiles)
			.innerJoin(
				privacySettings,
				eq(privacySettings.accountId, profiles.accountId),
			)
			.where(profileIndexableCondition())
			.orderBy(asc(profiles.id))
			.limit(SITEMAP_PAGE_SIZE)
			.offset(offset);

		urls = rows.map(
			(row) =>
				`<url><loc>${escapeXml(`${appUrl}/@${encodeURIComponent(row.name)}`)}</loc></url>`,
		);
	} else {
		const rows = await db
			.select({
				id: posts.id,
				createdAt: posts.createdAt,
				updatedAt: posts.updatedAt,
			})
			.from(posts)
			.innerJoin(profiles, eq(profiles.id, posts.profileId))
			.where(postIndexableCondition(db))
			.orderBy(asc(posts.id))
			.limit(SITEMAP_PAGE_SIZE)
			.offset(offset);

		urls = rows.map((row) => {
			const lastmod = (row.updatedAt ?? row.createdAt).toISOString();

			return `<url><loc>${escapeXml(`${appUrl}/posts/${encodeURIComponent(row.id)}`)}</loc><lastmod>${lastmod}</lastmod></url>`;
		});
	}

	// Une page vide n'existe que pour la première (sitemap vide mais valide).
	if (urls.length === 0 && page > 1) return null;

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
};
