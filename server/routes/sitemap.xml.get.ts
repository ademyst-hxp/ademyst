import { renderSitemapIndex, sendXml } from "#server/utils/sitemap";

// Index des sitemaps (profils et publications indexables).
export default defineEventHandler(async (event) => {
	return sendXml(event, await renderSitemapIndex(event));
});
