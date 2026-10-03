import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "@/server/db/connect";
import { Article, Business, Page, SeoSetting } from "@/server/models";
import { siteEnv } from "@/server/env";
import { CONTENT_LIFE, TAGS, toPlain } from "./_cache";
import { getSiteSettings } from "./content";

/**
 * Metadata builders.
 * ---------------------------------------------------------------------------
 * Precedence, most specific first:
 *   item override (business.seo / article.seo)
 *     → route record (SeoSetting, edited on the dashboard SEO page)
 *       → site defaults (SiteSettings.seo)
 *
 * Next merges metadata shallowly, so a page that sets `openGraph` replaces
 * the layout's object entirely. Every builder therefore returns a complete
 * openGraph/twitter block rather than relying on inheritance.
 *
 * Share image precedence: item override → route record's image → the
 * generated title card for that route (/og/<key>, app/og/[key]/route.js).
 */

/** "/uploads/x.jpg" → "https://warrickgroup.com/uploads/x.jpg"; absolute URLs pass through. */
export const absoluteUrl = (path) => (path ? new URL(path, siteEnv().NEXT_PUBLIC_SITE_URL).toString() : undefined);

/** The generated 1200×630 title card for a route record. */
export const ogCardPath = (key) => `/og/${key}`;

export async function getRouteSeo(key) {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.seo);

    await connectDB();
    const row = await SeoSetting.findOne({ key }, { sitemap: 0, createdAt: 0, updatedAt: 0 }).lean();
    return toPlain(row);
}

/** Root layout metadata: base URL, title template, verification, icons. */
export async function buildRootMetadata() {
    const { brand, seo = {} } = await getSiteSettings();
    const verification = {};
    if (seo.googleVerification) verification.google = seo.googleVerification;
    if (seo.bingVerification) verification.other = { "msvalidate.01": seo.bingVerification };

    return {
        metadataBase: new URL(siteEnv().NEXT_PUBLIC_SITE_URL),
        applicationName: seo.siteName || brand.name,
        title: {
            default: seo.defaultTitle || brand.name,
            template: seo.titleTemplate || `%s | ${brand.name}`,
        },
        description: seo.defaultDescription,
        icons: { icon: brand.logo || "/logo.png" },
        verification,
        ...social(seo, {
            title: seo.defaultTitle || brand.name,
            description: seo.defaultDescription,
            image: seo.defaultOgImage,
            path: "/",
        }),
    };
}

/**
 * Metadata for a route that has a SeoSetting record.
 * @param {string} key  SeoSetting.key ("about", "news", …)
 * @param {{ title?: string, description?: string, image?: string, path?: string,
 *           noindex?: boolean, type?: "website"|"article", publishedTime?: string }} [override]
 */
export async function buildPageMetadata(key, override = {}) {
    const [{ seo = {} }, route] = await Promise.all([getSiteSettings(), getRouteSeo(key)]);

    const path = override.path ?? route?.path ?? "/";
    const rawTitle = override.title || route?.title || seo.defaultTitle;
    const description = override.description || route?.description || seo.defaultDescription;
    const image = override.image || route?.ogImage || (route ? ogCardPath(route.key) : seo.defaultOgImage);
    const noindex = Boolean(override.noindex || route?.noindex);

    /* Home carries the full brand title, so it opts out of the template. */
    const title = key === "home" && !override.title ? { absolute: rawTitle } : rawTitle;

    return {
        title,
        description,
        keywords: route?.keywords?.length ? route.keywords : undefined,
        alternates: { canonical: path },
        robots: noindex ? { index: false, follow: true } : undefined,
        ...social(seo, {
            title: typeof title === "string" ? fillTemplate(seo.titleTemplate, title) : title.absolute,
            description,
            image,
            path,
            type: override.type,
            publishedTime: override.publishedTime,
        }),
    };
}

function fillTemplate(template, title) {
    return template?.includes("%s") ? template.replace("%s", title) : title;
}

function social(seo, { title, description, image, path, type = "website", publishedTime }) {
    /* Generated cards have a known size; say so, so platforms don't guess. */
    const images = image
        ? [image.startsWith("/og/") ? { url: image, width: 1200, height: 630, alt: title } : { url: image }]
        : undefined;
    return {
        openGraph: {
            type,
            siteName: seo.siteName,
            locale: seo.locale,
            url: path,
            title,
            description,
            images,
            ...(publishedTime ? { publishedTime } : {}),
        },
        twitter: {
            card: "summary_large_image",
            site: seo.twitterHandle || undefined,
            title,
            description,
            images: image ? [image] : undefined,
        },
    };
}

/* ---- Sitemap ------------------------------------------------------------- */

/* Page documents whose edits move a sitemap lastModified. */
const PAGE_TAG_KEYS = ["home", "about", "businesses", "sustainability", "innovation", "news", "contact"];
const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Everything app/sitemap.js lists: route records marked "include" and not
 * noindex, plus every published business and article without its own
 * noindex. Detail pages take their section's frequency and a slightly lower
 * priority. lastModified is when the content last changed.
 * @returns {Promise<Array<{ url: string, lastModified?: string, changeFrequency?: string, priority?: number }>>}
 */
export async function getSitemapEntries() {
    "use cache";
    cacheLife(CONTENT_LIFE);
    cacheTag(TAGS.seo, TAGS.businesses, TAGS.news, ...PAGE_TAG_KEYS.map(TAGS.page));

    await connectDB();
    const [routes, pages, businesses, articles] = await Promise.all([
        SeoSetting.find({}, { key: 1, path: 1, noindex: 1, sitemap: 1, updatedAt: 1 }).lean(),
        Page.find({}, { key: 1, updatedAt: 1 }).lean(),
        Business.find({ isPublished: true }, { slug: 1, updatedAt: 1, "seo.noindex": 1 }).sort({ order: 1 }).lean(),
        Article.find({ status: "published" }, { slug: 1, updatedAt: 1, publishedAt: 1, "seo.noindex": 1 })
            .sort({ publishedAt: -1 })
            .lean(),
    ]);

    const pageUpdated = new Map(pages.map((p) => [p.key, p.updatedAt]));
    const byKey = new Map(routes.map((r) => [r.key, r]));
    const iso = (date) => (date ? new Date(date).toISOString() : undefined);

    const entries = routes
        .filter((r) => r.sitemap?.include !== false && !r.noindex)
        .sort((a, b) => (b.sitemap?.priority ?? 0) - (a.sitemap?.priority ?? 0))
        .map((r) => ({
            url: absoluteUrl(r.path),
            lastModified: iso(pageUpdated.get(r.key) ?? r.updatedAt),
            changeFrequency: r.sitemap?.changeFrequency,
            priority: r.sitemap?.priority,
        }));

    /* Detail pages inherit their section's frequency, one step lower priority. */
    const child = (key, fallbackFrequency, fallbackPriority) => {
        const parent = byKey.get(key);
        return {
            changeFrequency: parent?.sitemap?.changeFrequency ?? fallbackFrequency,
            priority: round1(Math.max(0.1, (parent?.sitemap?.priority ?? fallbackPriority) - 0.1)),
        };
    };

    const company = child("businesses", "monthly", 0.9);
    for (const b of businesses) {
        if (b.seo?.noindex) continue;
        entries.push({ url: absoluteUrl(`/businesses/${b.slug}`), lastModified: iso(b.updatedAt), ...company });
    }
    /* A release rarely changes once published. */
    const release = { ...child("news", "weekly", 0.8), changeFrequency: "monthly" };
    for (const a of articles) {
        if (a.seo?.noindex) continue;
        entries.push({ url: absoluteUrl(`/news/${a.slug}`), lastModified: iso(a.updatedAt ?? a.publishedAt), ...release });
    }
    return entries;
}
