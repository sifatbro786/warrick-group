import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/server/services/content";
import { getRouteSeo } from "@/server/services/seo";
import { siteEnv } from "@/server/env";
import { TAGS } from "@/server/services/_cache";

/**
 * GET /og/<route key> — the 1200×630 share card for a page that has no image
 * of its own (see buildPageMetadata). Brand ground, gold rule, logo, the
 * page's SEO title. Rendered once per title and cached; editing the title on
 * the SEO page (TAGS.seo) or the brand (TAGS.site) redraws it.
 *
 * Fonts are the site's own faces as woff (ImageResponse can't read woff2),
 * read once at module scope with a statically scoped path so the build
 * traces them into the server bundle.
 */

const assets = Promise.all([
    readFile(join(process.cwd(), "assets/og/space-grotesk-latin-700-normal.woff")),
    readFile(join(process.cwd(), "assets/og/plus-jakarta-sans-latin-500-normal.woff")),
    readFile(join(process.cwd(), "public/logo.png"), "base64"),
]);

const KEY = /^[a-z0-9-]{1,60}$/;

async function renderCard(key) {
    "use cache";
    cacheLife("days");
    cacheTag(TAGS.seo, TAGS.site);

    const [route, site] = await Promise.all([getRouteSeo(key), getSiteSettings()]);
    if (!route) return null;

    const [display, body, logo] = await assets;
    const brand = site.brand?.name || "Warrick Group";
    const title = route.title || site.seo?.defaultTitle || brand;
    const eyebrow = key === "home" ? site.brand?.legalName || brand : route.label;
    const host = new URL(siteEnv().NEXT_PUBLIC_SITE_URL).host;

    const response = new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "72px 80px",
                    background: "linear-gradient(135deg, #180d28 0%, #2e1a47 62%, #4a2e73 100%)",
                    color: "#ffffff",
                    fontFamily: "Jakarta",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- satori renders <img>, not next/image */}
                    <img src={`data:image/png;base64,${logo}`} height={56} width={71} />
                    <span style={{ fontFamily: "Grotesk", fontSize: 30, letterSpacing: 1 }}>{brand.toUpperCase()}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ width: 72, height: 4, background: "#c5a059", marginBottom: 34 }} />
                    <span style={{ fontSize: 24, color: "#e2c98f", letterSpacing: 5, textTransform: "uppercase" }}>{eyebrow}</span>
                    <span
                        style={{
                            fontFamily: "Grotesk",
                            fontSize: title.length > 48 ? 58 : 70,
                            lineHeight: 1.08,
                            marginTop: 22,
                            maxWidth: 1000,
                        }}
                    >
                        {title}
                    </span>
                </div>

                <span style={{ fontSize: 24, color: "rgba(255,255,255,0.6)" }}>{host}</span>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            fonts: [
                { name: "Grotesk", data: display, weight: 700, style: "normal" },
                { name: "Jakarta", data: body, weight: 500, style: "normal" },
            ],
        },
    );
    return new Uint8Array(await response.arrayBuffer());
}

export async function GET(_request, { params }) {
    const { key } = await params;
    const png = KEY.test(key) ? await renderCard(key) : null;
    if (!png) return new Response("Not found", { status: 404 });

    return new Response(png, {
        headers: {
            "Content-Type": "image/png",
            /* Browsers and CDNs keep it a day; a title edit changes the card at the next fetch. */
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
    });
}
