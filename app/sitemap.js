import { getSitemapEntries } from "@/server/services/seo";

/**
 * /sitemap.xml — built from the dashboard: the SEO page decides which routes
 * are listed (Sitemap → Include, Hide from search engines) and their
 * priority/frequency; every published business and article is added.
 * Prerendered, and refreshed by the same cache tags the dashboard updates.
 */
export default async function sitemap() {
    return getSitemapEntries();
}
