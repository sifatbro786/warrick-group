import { REMOTE_IMAGE_HOSTS } from "./lib/images.js";

const isDev = process.env.NODE_ENV === "development";
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

/**
 * Content-Security-Policy — header-based, without nonces.
 * ---------------------------------------------------------------------------
 * A nonce-based CSP would force every page to render per request, giving up
 * the static, cacheable public site (see the Next "Content Security Policy"
 * guide). This policy keeps pages static and still shuts the main doors:
 *   - scripts only from this origin (+ inline, which Next's streamed RSC
 *     payload needs without nonces); no eval in production
 *   - no plugins, no <base> hijack, forms post only to this origin,
 *     nobody may frame the site
 *   - images from this origin or https (pasted remote images render
 *     unoptimised, see components/ui/SmartImage.js), data:/blob: for previews
 *   - the only third-party frame is the Google Maps embed on /contact
 * /uploads/* has its own, stricter policy (app/uploads/[...path]/route.js).
 */
const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "frame-src https://www.google.com https://maps.google.com",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    /* Only on a real https deployment: on `next start` over http://localhost
       it would upgrade every asset request to https and break the page. */
    ...(isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

/** Security headers applied to every response. */
const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    /* Same rule as CSP frame-ancestors, for older browsers. */
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    /* Isolates the window from cross-origin popups (window.opener attacks). */
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,

    /* "use cache" + cacheTag on the service layer: public pages prerender to
       static HTML and are invalidated per tag when the dashboard saves. */
    cacheComponents: true,

    /* Native binary — keep it out of the server bundle. */
    serverExternalPackages: ["@node-rs/argon2"],

    images: {
        formats: ["image/avif", "image/webp"],
        /* Next 16 only allows quality 75 unless listed here. */
        qualities: [70, 75, 85],
        /* Local images (public/ and dashboard uploads under /uploads) may be
           optimised, but never with a query string: stops the optimiser from
           being used to mint endless cache variants of one file. */
        localPatterns: [{ pathname: "/**", search: "" }],
        /* Hosts live in lib/images.js; SmartImage renders any other host
           unoptimised instead of failing the page. */
        remotePatterns: REMOTE_IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })),
    },

    async headers() {
        return [
            { source: "/:path*", headers: securityHeaders },
            /* Everything except /uploads, which sends its own CSP. */
            { source: "/((?!uploads/).*)", headers: [{ key: "Content-Security-Policy", value: csp }] },
        ];
    },
};

export default nextConfig;
