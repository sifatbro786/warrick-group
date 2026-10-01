"use server";

import "server-only";
import { after } from "next/server";
import { contactSchema, fieldErrors } from "@/server/validators/contact";
import { createInquiry, deliverInquiryMail } from "@/server/services/inquiry";
import { hitRateLimit } from "@/server/services/rate-limit";
import { getRequestMeta } from "@/server/services/request";

/* 5 inquiries per IP per 10 minutes. Generous for a person, useless for a
   script. */
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Contact form submission.
 * ---------------------------------------------------------------------------
 * Public endpoint (every Server Action is a POST anyone can call), so it
 * trusts nothing from the client:
 *   validate (Zod) → honeypot → rate limit → save → mail via after()
 *
 * @param {unknown} input  plain object from the form
 * @returns {Promise<{ status: "success", reference: string }
 *                 | { status: "invalid", errors: Record<string, string> }
 *                 | { status: "error", message?: string }>}
 */
export async function submitInquiry(input) {
    const parsed = contactSchema.safeParse(input ?? {});
    if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

    const { website, ...data } = parsed.data;

    /* Honeypot filled: answer like a success so the bot learns nothing,
       store nothing, send nothing. */
    if (website) return { status: "success", reference: `WG-${Date.now().toString(36).toUpperCase()}` };

    try {
        const meta = await getRequestMeta();

        const limit = await hitRateLimit(`contact:ip:${meta.ipHash}`, LIMIT, WINDOW_MS);
        if (!limit.allowed) {
            return {
                status: "error",
                message: `Too many inquiries from this connection. Please try again in ${Math.ceil(
                    limit.retryAfterSec / 60,
                )} minutes.`,
            };
        }

        const result = await createInquiry(data, meta);
        if (!result.ok) return { status: "invalid", errors: { inquiryType: "Select an inquiry type." } };

        /* Mail after the response is sent: the visitor never waits on SMTP. */
        after(() => deliverInquiryMail(result));

        return { status: "success", reference: result.inquiry.reference };
    } catch (error) {
        console.error("[contact] submission failed:", error);
        return { status: "error" };
    }
}
