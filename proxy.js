import { NextResponse } from "next/server";
import { sessionCookie, shouldRefresh, signSession, verifySessionToken } from "@/server/auth/jwt";
import { isKnownSlug } from "@/server/routing/known-slugs";
import { SLUG } from "@/server/validators/patterns";

/**
 * Two jobs (Next 16 `proxy`, formerly middleware):
 *   /admin/**                  → the session gate below
 *   /businesses/<slug>, /news/<slug> → a real 404 for slugs that don't exist
 */
export async function proxy(request) {
    const detail = request.nextUrl.pathname.match(DETAIL);
    if (detail) return detailGate(request, detail[1], detail[2]);
    return adminGate(request);
}

/* ---- Detail pages: real 404 ---------------------------------------------- */

const DETAIL = /^\/(businesses|news)\/([^/]+)\/?$/;

/**
 * Published companies and releases are static pages; anything else would
 * otherwise get the not-found view with status 200 (a "soft 404" search
 * engines dislike). Unknown slugs are rewritten to a path no route matches,
 * so Next renders the site's not-found page with a real 404 status.
 */
async function detailGate(request, kind, rawSlug) {
    let slug;
    try {
        slug = decodeURIComponent(rawSlug);
    } catch {
        slug = "";
    }
    if (SLUG.test(slug) && (await isKnownSlug(kind, slug))) return NextResponse.next();

    const response = NextResponse.rewrite(new URL("/__not-found", request.url));
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
}

/* ---- /admin gate ----------------------------------------------------------- */

/**
 * Admin gate (Next 16 `proxy`, formerly middleware).
 * ---------------------------------------------------------------------------
 * Optimistic only: it verifies the JWT signature/expiry and redirects, with
 * no DB access. The authoritative check (user active, tokenVersion, role)
 * is the DAL in server/auth/dal.js, run by every admin page and action —
 * so a revoked session that still has a valid JWT gets past here and is
 * stopped there.
 *
 * Also slides the session: a token past half-life is re-signed with the same
 * tokenVersion and login time (capped at 7 days from login).
 */
async function adminGate(request) {
    const { pathname, search } = request.nextUrl;
    const { name, options } = sessionCookie();
    const session = await verifySessionToken(request.cookies.get(name)?.value);
    const isLogin = pathname === "/admin/login";

    /* The login page is never redirected from here: a JWT can be validly
       signed yet revoked (tokenVersion), and bouncing it to /admin would loop
       with the DAL sending it back. The login page asks the DAL instead. */
    let response;
    if (isLogin) {
        response = NextResponse.next();
    } else if (!session) {
        const url = new URL("/admin/login", request.url);
        if (pathname !== "/admin") url.searchParams.set("next", `${pathname}${search}`);
        response = NextResponse.redirect(url);
    } else {
        response = NextResponse.next();
    }

    if (!session && request.cookies.has(name)) {
        response.cookies.set(name, "", { ...options, maxAge: 0 }); // expired or tampered
    } else if (session && !isLogin && shouldRefresh(session)) {
        const { token, maxAge } = await signSession(session);
        response.cookies.set(name, token, { ...options, maxAge });
    }

    /* Belt and braces next to the noindex metadata: keep the dashboard out
       of search engines and shared caches. */
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
}

export const config = {
    matcher: ["/admin", "/admin/:path*", "/businesses/:slug", "/news/:slug"],
};
