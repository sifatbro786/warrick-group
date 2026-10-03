import "server-only";
import { absoluteUrl } from "./seo";

/**
 * schema.org builders. Everything comes from the same records the pages
 * render, so structured data can't drift from what a visitor sees.
 * Ids are stable URLs ("…/#organization") so entities on different pages
 * link to one Organization.
 */

const id = (path, fragment) => `${absoluteUrl(path)}#${fragment}`;
export const ORG_ID = () => id("/", "organization");
const SITE_ID = () => id("/", "website");

const clean = (value) => {
    if (Array.isArray(value)) {
        const out = value.map(clean).filter((v) => v !== undefined);
        return out.length ? out : undefined;
    }
    if (value && typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            const c = clean(v);
            if (c !== undefined && c !== "" && c !== null) out[k] = c;
        }
        return Object.keys(out).length ? out : undefined;
    }
    return value;
};

/** Organization + WebSite, on every public page (site layout). */
export function siteGraph(site, offices = []) {
    const hq = offices.find((o) => o.isHeadquarters) ?? offices[0];
    const address = hq
        ? {
              "@type": "PostalAddress",
              streetAddress: hq.address?.slice(0, -2).join(", ") || hq.address?.[0],
              addressLocality: hq.city,
              addressCountry: hq.address?.at(-1),
          }
        : undefined;

    return [
        clean({
            "@type": "Organization",
            "@id": ORG_ID(),
            name: site.brand?.legalName || site.brand?.name,
            alternateName: site.brand?.name !== site.brand?.legalName ? site.brand?.name : undefined,
            url: absoluteUrl("/"),
            logo: { "@type": "ImageObject", url: absoluteUrl(site.brand?.logo || "/logo.png") },
            description: site.seo?.defaultDescription,
            sameAs: site.seo?.sameAs,
            address,
            contactPoint: offices
                .filter((o) => o.email || o.phone)
                .map((o) => ({
                    "@type": "ContactPoint",
                    contactType: o.role || "corporate",
                    email: o.email,
                    telephone: o.phone,
                    areaServed: o.city,
                })),
        }),
        clean({
            "@type": "WebSite",
            "@id": SITE_ID(),
            name: site.seo?.siteName || site.brand?.name,
            url: absoluteUrl("/"),
            inLanguage: (site.seo?.locale || "en_GB").replace("_", "-"),
            publisher: { "@id": ORG_ID() },
        }),
    ];
}

/** @param {Array<{ name: string, path: string }>} trail  Home first. */
export function breadcrumb(trail) {
    return {
        "@type": "BreadcrumbList",
        itemListElement: trail.map((step, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: step.name,
            item: absoluteUrl(step.path),
        })),
    };
}

export function newsArticle(article) {
    const url = absoluteUrl(`/news/${article.slug}`);
    return clean({
        "@type": "NewsArticle",
        "@id": `${url}#article`,
        mainEntityOfPage: url,
        headline: article.title.slice(0, 110),
        description: article.summary,
        image: article.coverImage?.url ? [absoluteUrl(article.coverImage.url)] : undefined,
        datePublished: article.publishedAt,
        articleSection: article.category?.label,
        author: { "@id": ORG_ID() },
        publisher: { "@id": ORG_ID() },
    });
}

export function companyPage(entity) {
    const url = absoluteUrl(`/businesses/${entity.slug}`);
    return clean({
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: entity.name,
        url: entity.website?.status === "live" ? entity.website.url : url,
        description: entity.summary,
        foundingDate: entity.established,
        image: entity.coverImage?.url ? absoluteUrl(entity.coverImage.url) : undefined,
        parentOrganization: entity.type === "parent" ? undefined : { "@id": ORG_ID() },
    });
}
