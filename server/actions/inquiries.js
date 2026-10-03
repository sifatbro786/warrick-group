"use server";

import "server-only";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authorize } from "@/server/auth/dal";
import { audit } from "@/server/services/audit";
import { deleteInquiry, markInquiryRead, setInquiryStatus } from "@/server/services/inquiry-admin";
import { objectId } from "@/server/validators/_shared";

/** Inbox actions. Any signed-in admin may triage; deleting is super_admin only. */

const statusSchema = z.enum(["new", "read", "archived"]);
const GONE = { status: "error", message: "That inquiry no longer exists." };

export async function setInquiryStatusAction(id, status) {
    const { user } = await authorize();
    if (!objectId.safeParse(id).success || !statusSchema.safeParse(status).success) return GONE;

    const inquiry = await setInquiryStatus(id, status);
    if (!inquiry) return GONE;

    if (status === "archived") {
        await audit(user, { action: "archive", entity: "Inquiry", entityId: id, summary: `Archived inquiry ${inquiry.reference}` });
    }
    refresh();
    return {
        status: "success",
        message: { new: "Marked as unread.", read: "Marked as read.", archived: "Archived." }[status],
    };
}

/** Called once when an inquiry is opened. Silent: no toast, no audit. */
export async function markInquiryReadAction(id) {
    await authorize();
    if (!objectId.safeParse(id).success) return { status: "error" };
    const changed = await markInquiryRead(id);
    if (changed) refresh();
    return { status: "success" };
}

export async function deleteInquiryAction(id) {
    const { user, denied } = await authorize({ superAdmin: true });
    if (denied) return denied;
    if (!objectId.safeParse(id).success) return GONE;

    const inquiry = await deleteInquiry(id);
    if (!inquiry) return GONE;

    await audit(user, { action: "delete", entity: "Inquiry", entityId: id, summary: `Deleted inquiry ${inquiry.reference}` });
    redirect("/admin/inquiries");
}
