import { connectDB } from "../db/connect.js";
import { Article, Business } from "../models/index.js";

/**
 * Published slugs, for proxy.js to answer unknown /businesses/<slug> and
 * /news/<slug> with a real HTTP 404 (Cache Components streams the static
 * shell before a page could call notFound(), so the page alone can only give
 * a "soft" 404 with status 200).
 *
 * Kept in process memory: one small query per minute per instance. A slug
 * that isn't in the list triggers an early refresh (at most every 3 s), so
 * a business published a moment ago is reachable straight away.
 *
 * Fails open: if MongoDB can't be reached, every slug counts as known and the
 * page's own not-found handling takes over. A database blip must never turn
 * real pages into 404s.
 *
 * No "server-only" import: proxy.js isn't a React Server Component.
 */

const TTL_MS = 60_000;
const MISS_REFRESH_MS = 3_000;

let state = { loadedAt: 0, businesses: new Set(), news: new Set() };
let inflight = null;

async function load() {
    await connectDB();
    const [businesses, articles] = await Promise.all([
        Business.find({ isPublished: true }, { slug: 1 }).lean(),
        Article.find({ status: "published" }, { slug: 1 }).lean(),
    ]);
    state = {
        loadedAt: Date.now(),
        businesses: new Set(businesses.map((b) => b.slug)),
        news: new Set(articles.map((a) => a.slug)),
    };
}

function refresh() {
    inflight ??= load().finally(() => {
        inflight = null;
    });
    return inflight;
}

/**
 * @param {"businesses"|"news"} kind
 * @param {string} slug
 * @returns {Promise<boolean>}
 */
export async function isKnownSlug(kind, slug) {
    try {
        if (Date.now() - state.loadedAt > TTL_MS) await refresh();
        if (state[kind].has(slug)) return true;
        if (Date.now() - state.loadedAt > MISS_REFRESH_MS) {
            await refresh();
            return state[kind].has(slug);
        }
        return false;
    } catch (error) {
        console.error("[proxy] slug check skipped:", error?.message ?? error);
        return true;
    }
}
