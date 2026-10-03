"use server";

import "server-only";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { authorize } from "@/server/auth/dal";
import { endSession, startSession } from "@/server/auth/session";
import { audit } from "@/server/services/audit";
import { authenticate, changeOwnPassword, revokeAllSessions, updateOwnProfile } from "@/server/services/auth";
import { getRequestMeta } from "@/server/services/request";
import { changePasswordSchema, loginSchema, profileSchema } from "@/server/validators/auth";
import { fieldErrors } from "@/server/validators/_shared";

/**
 * Login, logout and self-service account actions.
 * Result shape for every form: { status: "success" | "invalid" | "error", errors?, message? }.
 */

/** Only same-site admin paths; never "//host" or "/\\host". */
const safeNext = (value) =>
    typeof value === "string" && /^\/admin(?:[/?#]|$)/.test(value) && !/[\\]|\/\//.test(value) && value !== "/admin/login"
        ? value
        : "/admin";

export async function login(input) {
    const parsed = loginSchema.safeParse(input ?? {});
    if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

    let result;
    try {
        result = await authenticate(parsed.data, await getRequestMeta());
    } catch (error) {
        console.error("[auth] login failed:", error);
        return { status: "error", message: "Sign-in is unavailable right now. Please try again shortly." };
    }

    if (!result.ok) {
        if (result.reason === "invalid") return { status: "error", message: "Incorrect email or password." };
        return {
            status: "error",
            message: `Too many failed attempts. Try again in ${result.retryMinutes} minute${result.retryMinutes === 1 ? "" : "s"}.`,
        };
    }

    await startSession(result.user);
    await audit({ id: String(result.user._id), email: result.user.email }, { action: "login", entity: "User", entityId: result.user._id });

    /* Outside any try/catch: redirect() works by throwing. */
    redirect(safeNext(input?.next));
}

export async function logout() {
    await endSession();
    redirect("/admin/login");
}

export async function logoutEverywhere() {
    const { user } = await authorize();
    await revokeAllSessions(user.id);
    await endSession();
    await audit(user, { action: "logout-all", entity: "User", entityId: user.id, summary: "Signed out of every device" });
    redirect("/admin/login");
}

export async function changePassword(input) {
    const { user } = await authorize();
    const parsed = changePasswordSchema.safeParse(input ?? {});
    if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

    const result = await changeOwnPassword(user.id, parsed.data);
    if (!result.ok) return { status: "invalid", errors: { [result.field]: result.message } };

    /* Other devices are now signed out; this one keeps going with a fresh
       cookie but the original login time, so the 7-day cap still holds. */
    await startSession(result.user, user.authTime);
    await audit(user, { action: "password", entity: "User", entityId: user.id, summary: "Changed own password" });
    return { status: "success", message: "Password changed. Other devices have been signed out." };
}

export async function updateProfile(input) {
    const { user } = await authorize();
    const parsed = profileSchema.safeParse(input ?? {});
    if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

    await updateOwnProfile(user.id, parsed.data);
    refresh();
    return { status: "success", message: "Profile updated." };
}
