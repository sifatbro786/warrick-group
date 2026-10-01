import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "@/server/db/connect";
import {
    Article,
    Business,
    Leader,
    NewsCategory,
    Office,
    Page,
    Report,
    SiteSettings,
    Venture,
} from "@/server/models";
import { CONTENT_LIFE, TAGS, toPlain } from "./_cache";

/**
 * Public read layer.
 * ---------------------------------------------------------------------------
 * Server Components call these directly — never through an internal fetch.
 * Every function is a "use cache" entry tagged for on-demand invalidation, so
 * pages prerender to static HTML at build and refresh when the dashboard
 * saves.
 *
 * Rules for this file:
 *   · only published records reach the public site
 *   · projections drop server-only fields (`routeTo`, `updatedBy`, timestamps)
 *   · list queries never load bodies (`-content`) unless the page renders them
 */

const HIDDEN = { updatedBy: 0, createdAt: 0, updatedAt: 0 };

/* ---- Site settings ------------------------------------------------------- */

/** Navbar, footer, brand and SEO defaults. `inquiryTypes[].routeTo` is
    projected out: the browser must never learn the desk mailboxes. */
export async function getSiteSettings() {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.site);

    await connectDB();
    const site = await SiteSettings.findOne({ key: "site" }, { ...HIDDEN, "inquiryTypes.routeTo": 0 }).lean();
    if (!site) throw new Error('Site settings missing — run "npm run seed".');
    return toPlain(site);
}

/* ---- Page documents ------------------------------------------------------ */

/**
 * @param {"home"|"about"|"businesses"|"sustainability"|"innovation"|"news"|"contact"} key
 */
export async function getPage(key) {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.page(key));

    await connectDB();
    const page = await Page.findOne({ key }, HIDDEN).lean();
    if (!page) throw new Error(`Page "${key}" missing — run "npm run seed".`);
    return toPlain(page);
}

/* ---- Businesses ---------------------------------------------------------- */

const published = { isPublished: true };

/** Index rows, nav dropdown and the "elsewhere" band. No detail body. */
export async function listBusinesses() {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.businesses);

    await connectDB();
    const rows = await Business.find(published, { ...HIDDEN, detail: 0, seo: 0 })
        .sort({ order: 1, name: 1 })
        .lean();
    return toPlain(rows);
}

export async function getBusinessBySlug(slug) {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.businesses);

    await connectDB();
    const row = await Business.findOne({ slug: String(slug), ...published }, HIDDEN).lean();
    return toPlain(row);
}

/* ---- Newsroom ------------------------------------------------------------ */

export async function listNewsCategories() {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.news);

    await connectDB();
    const rows = await NewsCategory.find({}, { key: 1, label: 1 }).sort({ order: 1 }).lean();
    return toPlain(rows);
}

/**
 * Published articles, newest first, without bodies. `category` is resolved
 * to `{ key, label }` so the grid never needs a second lookup.
 * @param {{ limit?: number }} [options]
 */
export async function listArticles({ limit = 0 } = {}) {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.news);

    await connectDB();
    const [rows, categories] = await Promise.all([
        Article.find({ status: "published" }, { ...HIDDEN, content: 0, seo: 0, status: 0 })
            .sort({ publishedAt: -1 })
            .limit(limit)
            .lean(),
        NewsCategory.find({}, { key: 1, label: 1 }).lean(),
    ]);
    return toPlain(rows.map((row) => withCategory(row, categories)));
}

export async function getArticleBySlug(slug) {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.news);

    await connectDB();
    const [row, categories] = await Promise.all([
        Article.findOne({ slug: String(slug), status: "published" }, { ...HIDDEN, status: 0 }).lean(),
        NewsCategory.find({}, { key: 1, label: 1 }).lean(),
    ]);
    return row ? toPlain(withCategory(row, categories)) : null;
}

function withCategory(article, categories) {
    const category = categories.find((c) => String(c._id) === String(article.category));
    return { ...article, category: category ? { key: category.key, label: category.label } : null };
}

/* ---- About, innovation, sustainability, contact -------------------------- */

export async function listLeaders() {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.leaders);

    await connectDB();
    const rows = await Leader.find(published, HIDDEN).sort({ order: 1 }).lean();
    return toPlain(rows);
}

/** Includes `detail`: six records, and the dialog opens without a round trip. */
export async function listVentures() {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.ventures);

    await connectDB();
    const rows = await Venture.find(published, HIDDEN).sort({ order: 1 }).lean();
    return toPlain(rows);
}

export async function listReports() {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.reports);

    await connectDB();
    const rows = await Report.find(published, HIDDEN).sort({ order: 1 }).lean();
    return toPlain(rows);
}

/** Head office first, then by `order`. */
export async function listOffices() {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.offices);

    await connectDB();
    const rows = await Office.find(published, HIDDEN).sort({ isHeadquarters: -1, order: 1 }).lean();
    return toPlain(rows);
}

/* ---- Misc ---------------------------------------------------------------- */

/**
 * The copyright year. Cache Components refuses a bare `new Date()` during
 * prerender (it would freeze the build time into the page silently), so the
 * clock is read inside a cache scope with a daily lifetime instead.
 */
export async function getCurrentYear() {
    "use cache";
    cacheLife("days");
    return new Date().getUTCFullYear();
}
