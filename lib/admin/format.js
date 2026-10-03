/**
 * Dashboard date formatting. Rendered on the server, so the zone is pinned
 * (Vercel runs in UTC). Change ADMIN_TIME_ZONE if the team moves.
 */
export const ADMIN_TIME_ZONE = "Asia/Dhaka";

const dateTime = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ADMIN_TIME_ZONE,
});
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: ADMIN_TIME_ZONE });
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 Oct 2026, 14:05" */
export const formatDateTime = (value) => (value ? dateTime.format(new Date(value)) : "—");

/** "5 min ago", "yesterday", then "3 Oct". Server Components render once per
    request, so "now" is the request time. */
export function formatRelative(value, now = Date.now()) {
    if (!value) return "—";
    const diff = (new Date(value).getTime() - now) / 1000;
    const abs = Math.abs(diff);
    if (abs < 60) return "just now";
    if (abs < 3600) return relative.format(Math.round(diff / 60), "minute");
    if (abs < 86400) return relative.format(Math.round(diff / 3600), "hour");
    if (abs < 7 * 86400) return relative.format(Math.round(diff / 86400), "day");
    return shortDate.format(new Date(value));
}
