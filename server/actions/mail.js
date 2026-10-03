"use server";

import "server-only";
import { authorize } from "@/server/auth/dal";
import { audit } from "@/server/services/audit";
import { sendTestMail } from "@/server/services/mail";
import { hitRateLimit } from "@/server/services/rate-limit";
import { getSiteForEdit } from "@/server/services/cms";

/** Settings → "Send a test email" to the signed-in admin's own address. */
export async function sendTestEmailAction() {
    const { user } = await authorize();

    /* Each click opens an SMTP session; keep a stuck button from hammering it. */
    const limit = await hitRateLimit(`mailtest:user:${user.id}`, 3, 10 * 60 * 1000);
    if (!limit.allowed) {
        return { status: "error", message: `Test limit reached. Try again in ${Math.ceil(limit.retryAfterSec / 60)} min.` };
    }

    const site = await getSiteForEdit();
    const result = await sendTestMail(user.email, site?.brand?.name);
    await audit(user, {
        action: "mail-test",
        entity: "SiteSettings",
        summary: result.ok ? `Sent a test email to ${user.email}` : "Test email failed",
    });
    return result.ok
        ? { status: "success", message: `Test email sent to ${user.email}. Check the inbox (and spam).` }
        : { status: "error", message: result.message };
}
