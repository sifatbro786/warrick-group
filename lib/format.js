/**
 * Presentation helpers shared by Server and Client Components.
 * Labels here are interface vocabulary, not content (see PHASES.md §3).
 */

/** Display ordinal from position: 0 → "01". Never stored. */
export const pad = (value) => String(value).padStart(2, "0");

/* Locale and zone are pinned so the server render and the browser agree. */
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
});

/** "Aug 2026" — home news strip, report rows. */
export const formatMonthYear = (iso) => monthYear.format(new Date(iso));

/** "12 August 2026" — newsroom. */
export const formatLongDate = (iso) => longDate.format(new Date(iso));

/** "2026-08-12" for <time dateTime>. */
export const isoDay = (iso) => new Date(iso).toISOString().slice(0, 10);

/** Roadmap milestone status. */
export const statusLabel = (status) =>
    ({ complete: "Delivered", active: "In Progress", planned: "Committed" })[status] ?? status;

/** Venture stage (ids match server/models/Venture.js VENTURE_STAGES). */
export const stageLabel = (stage) =>
    ({ research: "Research", pilot: "Pilot", scaling: "Scaling" })[stage] ?? stage;

/** Google Maps embed without an API key, and the matching "open" link. */
export const mapsEmbedUrl = ({ query, zoom = 15 }) =>
    `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&hl=en&output=embed`;

export const mapsLinkUrl = ({ query }) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

/** External links open in a new tab; internal ones use next/link. */
export const isExternal = (href = "") => /^(https?:|mailto:|tel:)/i.test(href);
