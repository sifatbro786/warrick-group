import { siteEnv } from "@/server/env";

/**
 * /robots.txt. Preview deployments (Vercel previews, or any host with
 * ROBOTS_DISALLOW_ALL=true, e.g. a staging VPS) tell crawlers to stay out, so
 * a test copy never competes with the real site in search results.
 */
export default function robots() {
    const site = siteEnv().NEXT_PUBLIC_SITE_URL;
    const hidden =
        process.env.ROBOTS_DISALLOW_ALL === "true" ||
        (process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== "production");

    if (hidden) return { rules: { userAgent: "*", disallow: "/" } };

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            /* The dashboard is also noindex + login-gated; this just saves crawl budget. */
            disallow: ["/admin", "/api/"],
        },
        sitemap: `${site}/sitemap.xml`,
        host: site,
    };
}
