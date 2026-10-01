import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "@/server/db/connect";
import { SeoSetting } from "@/server/models";
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
 */

async function getRouteSeo(key) {
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
    const image = override.image || route?.ogImage || seo.defaultOgImage;
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
    const images = image ? [{ url: image }] : undefined;
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
