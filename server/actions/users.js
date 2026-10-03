"use server";

import "server-only";
import { refresh } from "next/cache";
import { authorize } from "@/server/auth/dal";
import { audit } from "@/server/services/audit";
import { createUser, resetUserPassword, setUserActive, unlockUser, updateUser } from "@/server/services/users";
import { fieldErrors, objectId } from "@/server/validators/_shared";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "@/server/validators/auth";

/**
 * User management. Every action re-authorizes as super_admin: these are
 * public POST endpoints whatever the UI hides.
 */

const BAD_ID = { status: "error", message: "That user no longer exists." };

/** Shared tail: map a service result to a form result, audit, refresh. */
async function finish(actor, result, entry, message) {
    if (!result.ok) {
        return result.field
            ? { status: "invalid", errors: { [result.field]: result.message } }
            : { status: "error", message: result.message };
    }
    await audit(actor, { entity: "User", ...entry(result.user) });
    refresh();
    return { status: "success", message };
}

export async function createUserAction(input) {
    const { user: actor, denied } = await authorize({ superAdmin: true });
    if (denied) return denied;

    const parsed = createUserSchema.safeParse(input ?? {});
    if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

    const result = await createUser(actor, parsed.data);
    return finish(
        actor,
        result,
        (u) => ({ action: "create", entityId: u._id, summary: `Created ${u.email} (${u.role})` }),
        "Account created. Share the password with them securely.",
    );
}

export async function updateUserAction(id, input) {
    const { user: actor, denied } = await authorize({ superAdmin: true });
    if (denied) return denied;
    if (!objectId.safeParse(id).success) return BAD_ID;

    const parsed = updateUserSchema.safeParse(input ?? {});
    if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

    const result = await updateUser(actor, id, parsed.data);
    return finish(
        actor,
        result,
        (u) => ({ action: "update", entityId: id, summary: `Updated ${u.email} (${parsed.data.role})` }),
        "Changes saved.",
    );
}

export async function setUserActiveAction(id, active) {
    const { user: actor, denied } = await authorize({ superAdmin: true });
    if (denied) return denied;
    if (!objectId.safeParse(id).success || typeof active !== "boolean") return BAD_ID;

    const result = await setUserActive(actor, id, active);
    return finish(
        actor,
        result,
        (u) => ({ action: active ? "activate" : "deactivate", entityId: id, summary: `${active ? "Reactivated" : "Deactivated"} ${u.email}` }),
        active ? "Account reactivated." : "Account deactivated and signed out everywhere.",
    );
}

export async function resetUserPasswordAction(id, input) {
    const { user: actor, denied } = await authorize({ superAdmin: true });
    if (denied) return denied;
    if (!objectId.safeParse(id).success) return BAD_ID;

    const parsed = resetPasswordSchema.safeParse(input ?? {});
    if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

    const result = await resetUserPassword(actor, id, parsed.data);
    return finish(
        actor,
        result,
        (u) => ({ action: "reset-password", entityId: id, summary: `Reset password for ${u.email}` }),
        "Password reset. Their open sessions have ended.",
    );
}

export async function unlockUserAction(id) {
    const { user: actor, denied } = await authorize({ superAdmin: true });
    if (denied) return denied;
    if (!objectId.safeParse(id).success) return BAD_ID;

    const result = await unlockUser(id);
    return finish(
        actor,
        result,
        (u) => ({ action: "unlock", entityId: id, summary: `Unlocked ${u.email}` }),
        "Account unlocked.",
    );
}
