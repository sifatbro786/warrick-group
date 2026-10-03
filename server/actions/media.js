"use server";

import "server-only";
import { refresh } from "next/cache";
import { z } from "zod";
import { authorize } from "@/server/auth/dal";
import { audit } from "@/server/services/audit";
import { deleteMedia, listMedia, updateMediaAlt } from "@/server/services/media";
import { objectId } from "@/server/validators/_shared";

/**
 * Media library actions. Uploading is a Route Handler
 * (app/api/admin/media/route.js) because the body can be megabytes; these
 * are the small JSON operations.
 */

const querySchema = z.object({
    kind: z.enum(["image", "document"]).optional().catch(undefined),
    q: z.string().trim().max(100).optional().catch(undefined),
    page: z.coerce.number().int().min(1).max(1000).catch(1),
});

/** The picker's library tab. Reads go through an action so the dialog can page without a route. */
export async function listMediaAction(query) {
    await authorize();
    const parsed = querySchema.parse(query ?? {});
    const result = await listMedia(parsed);
    return { status: "success", ...result };
}

const altSchema = z.string().trim().max(300, "Keep alt text under 300 characters.").regex(/^[^\r\n]*$/, "One line only.");

export async function updateMediaAltAction(id, alt) {
    const { user } = await authorize();
    if (!objectId.safeParse(id).success) return { status: "error", message: "That file no longer exists." };
    const parsed = altSchema.safeParse(alt ?? "");
    if (!parsed.success) return { status: "invalid", errors: { alt: parsed.error.issues[0].message } };

    const result = await updateMediaAlt(id, parsed.data);
    if (!result.ok) return { status: "error", message: result.message };
    await audit(user, { action: "update", entity: "Media", entityId: id, summary: `Edited alt text of ${result.media.originalName || "a file"}` });
    refresh();
    return { status: "success", message: "Alt text saved. Images already placed keep their own alt text." };
}

export async function deleteMediaAction(id) {
    const { user, denied } = await authorize({ superAdmin: true });
    if (denied) return denied;
    if (!objectId.safeParse(id).success) return { status: "error", message: "That file no longer exists." };

    const result = await deleteMedia(id);
    if (!result.ok) return { status: "error", message: result.message };
    await audit(user, { action: "delete", entity: "Media", entityId: id, summary: `Deleted file ${result.media.originalName || result.media.key}` });
    refresh();
    return { status: "success", message: "File deleted." };
}
