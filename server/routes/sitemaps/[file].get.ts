import {
	renderSitemapPage,
	sendXml,
	type SitemapKind,
} from "#server/utils/sitemap";

// /sitemaps/profiles-1.xml, /sitemaps/posts-2.xml, …
const FILE = /^(profiles|posts)-([1-9]\d{0,5})\.xml$/;

export default defineEventHandler(async (event) => {
	const match = FILE.exec(event.context.params?.file ?? "");

	if (!match) {
		throw createError({ statusCode: 404, statusMessage: "Not found" });
	}

	const xml = await renderSitemapPage(
		event,
		match[1] as SitemapKind,
		Number(match[2]),
	);

	if (xml === null) {
		throw createError({ statusCode: 404, statusMessage: "Not found" });
	}

	return sendXml(event, xml);
});
