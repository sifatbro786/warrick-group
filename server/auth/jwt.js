import { SignJWT, jwtVerify } from "jose";
import { authEnv, siteEnv } from "../env.js";

/**
 * Session token (stateless JWT in an httpOnly cookie).
 * ---------------------------------------------------------------------------
 * Imported by proxy.js as well as the DAL, so it must not import
 * "server-only" or next/headers — it only signs and verifies strings.
 *
 * Claims:
 *   sub  user id
 *   tv   User.tokenVersion at sign time. The DAL compares it with the DB, so
 *        bumping tokenVersion revokes every session of that user instantly.
 *   at   auth time (unix s). Sliding refresh never extends past
 *        at + SESSION_MAX_AGE, so a stolen cookie can't live forever.
 *
 * The role is deliberately NOT a claim: it is read from the DB on every
 * request, so a demotion takes effect on the next click.
 */

const ISSUER = "warrick-group";
const AUDIENCE = "warrick-admin";
const ALG = "HS256";

/** Idle lifetime of a token. */
export const SESSION_TTL = 12 * 60 * 60; // 12 h
/** Refresh once less than this is left (proxy.js). */
export const SESSION_REFRESH_BELOW = 6 * 60 * 60; // 6 h
/** Hard cap from login, regardless of activity. */
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/**
 * `__Host-` pins the cookie to this exact host, Path=/ and Secure, so a
 * sibling subdomain can't set or shadow it. It requires HTTPS, so plain-http
 * local runs use an unprefixed name.
 */
export function sessionCookie() {
    const secure = siteEnv().NEXT_PUBLIC_SITE_URL.startsWith("https://");
    return {
        name: secure ? "__Host-wg_session" : "wg_session",
        options: { httpOnly: true, secure, sameSite: "lax", path: "/" },
    };
}

let keyCache;
const key = () => (keyCache ??= new TextEncoder().encode(authEnv().JWT_SECRET));

const now = () => Math.floor(Date.now() / 1000);

/**
 * @param {{ userId: string, tokenVersion: number, authTime?: number }} input
 * @returns {Promise<{ token: string, maxAge: number }>}
 */
export async function signSession({ userId, tokenVersion, authTime = now() }) {
    const exp = Math.min(now() + SESSION_TTL, authTime + SESSION_MAX_AGE);
    const token = await new SignJWT({ tv: tokenVersion, at: authTime })
        .setProtectedHeader({ alg: ALG, typ: "JWT" })
        .setSubject(String(userId))
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(exp)
        .sign(key());
    return { token, maxAge: Math.max(0, exp - now()) };
}

/**
 * Signature, issuer, audience, algorithm and expiry. No DB access.
 * @returns {Promise<{ userId: string, tokenVersion: number, authTime: number, exp: number } | null>}
 */
export async function verifySessionToken(token) {
    if (!token || typeof token !== "string" || token.length > 2048) return null;
    try {
        const { payload } = await jwtVerify(token, key(), {
            algorithms: [ALG],
            issuer: ISSUER,
            audience: AUDIENCE,
        });
        if (typeof payload.sub !== "string" || !/^[a-f0-9]{24}$/.test(payload.sub)) return null;
        if (!Number.isInteger(payload.tv) || !Number.isInteger(payload.at)) return null;
        return { userId: payload.sub, tokenVersion: payload.tv, authTime: payload.at, exp: payload.exp };
    } catch {
        return null;
    }
}

/** True when the token is past half-life and still inside the hard cap. */
export function shouldRefresh(session) {
    const left = session.exp - now();
    return left < SESSION_REFRESH_BELOW && session.authTime + SESSION_MAX_AGE - now() > 60;
}
