import "server-only";

/**
 * Cache tags shared by the public read layer and (from Phase 4) the admin
 * write layer. A save in the dashboard calls `updateTag()` with the same
 * constant the reader tagged its entry with, so the two can never drift.
 *
 *   updateTag(TAGS.page("about"))   after saving the About page
 *   updateTag(TAGS.businesses)      after any business create/update/delete
 */
export const TAGS = Object.freeze({
    site: "site",
    seo: "seo",
    page: (key) => `page:${key}`,
    businesses: "businesses",
    news: "news",
    leaders: "leaders",
    ventures: "ventures",
    reports: "reports",
    offices: "offices",
});

/**
 * Every public read uses this lifetime. Tags do the real invalidation; the
 * hourly revalidate is only a safety net for edits made outside the
 * dashboard (seed:reset, a manual DB fix).
 */
export const CONTENT_LIFE = "hours";

/**
 * Lean documents carry ObjectIds and Dates, which "use cache" cannot store
 * and Client Components cannot receive. One JSON pass turns them into strings.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export const toPlain = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));
