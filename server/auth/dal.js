import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/server/db/connect";
import { ROLES, User } from "@/server/models";
import { sessionCookie, verifySessionToken } from "./jwt";

/**
 * Data Access Layer for authentication.
 * ---------------------------------------------------------------------------
 * proxy.js only checks the JWT signature (cheap, optimistic). This is the
 * real check, run by every admin page and every Server Action:
 *   cookie → JWT → user in DB → active? → tokenVersion matches?
 *
 * Wrapped in React cache(): one DB lookup per request however many
 * components ask. Not "use cache: private" — a revoked session must stop
 * working on the next click, not after a browser cache lifetime.
 */

/**
 * @typedef {{ id: string, name: string, email: string, role: "super_admin"|"admin",
 *             isSuperAdmin: boolean, authTime: number }} SessionUser
 */

/** @returns {Promise<SessionUser | null>} */
export const getCurrentUser = cache(async () => {
    const { name } = sessionCookie();
    const token = (await cookies()).get(name)?.value;
    const session = await verifySessionToken(token);
    if (!session) return null;

    await connectDB();
    const user = await User.findById(session.userId, {
        name: 1,
        email: 1,
        role: 1,
        isActive: 1,
        tokenVersion: 1,
    }).lean();

    if (!user || !user.isActive || user.tokenVersion !== session.tokenVersion) return null;

    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.role === ROLES.SUPER_ADMIN,
        authTime: session.authTime,
    };
});

/** For pages: no session → login. */
export async function requireUser() {
    const user = await getCurrentUser();
    if (!user) redirect("/admin/login");
    return user;
}

/** For pages: an admin opening a super_admin page lands on the overview. */
export async function requireSuperAdmin() {
    const user = await requireUser();
    if (!user.isSuperAdmin) redirect("/admin");
    return user;
}

/**
 * For Server Actions. Returns the user, or an error result the form can
 * show. No session → redirect (the action's caller navigates to login).
 * @param {{ superAdmin?: boolean }} [options]
 * @returns {Promise<{ user: SessionUser, denied?: undefined } | { user?: undefined, denied: { status: "error", message: string } }>}
 */
export async function authorize({ superAdmin = false } = {}) {
    const user = await getCurrentUser();
    if (!user) redirect("/admin/login");
    if (superAdmin && !user.isSuperAdmin) {
        return { denied: { status: "error", message: "Only a super admin can do that." } };
    }
    return { user };
}
