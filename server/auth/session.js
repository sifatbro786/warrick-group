import "server-only";
import { cookies } from "next/headers";
import { sessionCookie, signSession } from "./jwt";

/**
 * Cookie writes. Only callable from Server Actions / Route Handlers
 * (cookies().set throws during render).
 */

/**
 * Issue a session cookie for `user`. Pass `authTime` to keep the original
 * login time (password change re-issues without resetting the hard cap).
 * @param {{ _id: unknown, tokenVersion: number }} user
 * @param {number} [authTime]
 */
export async function startSession(user, authTime) {
    const { name, options } = sessionCookie();
    const { token, maxAge } = await signSession({
        userId: String(user._id),
        tokenVersion: user.tokenVersion,
        authTime,
    });
    (await cookies()).set(name, token, { ...options, maxAge });
}

export async function endSession() {
    const { name, options } = sessionCookie();
    (await cookies()).set(name, "", { ...options, maxAge: 0 });
}
