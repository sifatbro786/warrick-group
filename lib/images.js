/**
 * Remote hosts next/image may optimise. next.config.mjs builds
 * `images.remotePatterns` from this list and components/ui/SmartImage.js
 * reads it at render, so the two can't drift.
 *
 * An image pasted from any other https host still renders — unoptimised —
 * instead of crashing the page with "hostname is not configured".
 * Add a host here (and redeploy) to have it optimised.
 */
export const REMOTE_IMAGE_HOSTS = Object.freeze([
    /* Seed placeholders. Remove once every image is uploaded. */
    "images.unsplash.com",
]);

/** @param {unknown} src */
export function canOptimize(src) {
    if (typeof src !== "string") return true; // static import
    if (src.startsWith("/") && !src.startsWith("//")) return true;
    try {
        const url = new URL(src);
        return url.protocol === "https:" && REMOTE_IMAGE_HOSTS.includes(url.hostname);
    } catch {
        return false;
    }
}
