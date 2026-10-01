/**
 * Security headers applied to every response.
 * A Content-Security-Policy is added in Phase 5: a nonce-based CSP forces
 * every page to render dynamically, so the public site and /admin get
 * different policies and that needs the finished page list.
 */
const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
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
        remotePatterns: [
            /* Seed content still points at Unsplash placeholders. Remove once
               every image has been replaced through the admin uploader. */
            { protocol: "https", hostname: "images.unsplash.com" },
        ],
    },

    async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
    },
};

export default nextConfig;
