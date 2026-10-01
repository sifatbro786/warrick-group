import "server-only";
import { randomBytes } from "node:crypto";
import { connectDB } from "@/server/db/connect";
import { Inquiry, SiteSettings } from "@/server/models";
import { escapeHtml, fallbackInbox, sendMail } from "./mail";

/**
 * Contact inquiries.
 * ---------------------------------------------------------------------------
 * Save first, mail second: an SMTP outage never loses a lead, and the
 * `mail` block on the record says what was delivered so the dashboard
 * inbox (Phase 3) can show failures.
 */

/** "WG-MG3K1Z-7Q4P": time-ordered, unguessable enough to quote on the phone. */
function newReference() {
    const time = Date.now().toString(36).toUpperCase();
    const rand = randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
    return `WG-${time}-${rand}`;
}

/**
 * Public desk list plus the server-only routing address. Read uncached and
 * only here — `routeTo` must never pass through the public cache layer.
 */
async function getInquiryTypes() {
    await connectDB();
    const site = await SiteSettings.findOne({ key: "site" }, { inquiryTypes: 1, brand: 1 }).lean();
    return { types: site?.inquiryTypes ?? [], brandName: site?.brand?.name || "Warrick Group" };
}

/**
 * Validate the desk against the live list, then persist.
 * @param {{ fullName: string, email: string, inquiryType: string, subject: string, message: string }} data
 * @param {{ ipHash: string|null, userAgent: string|null }} meta
 * @returns {Promise<{ ok: true, inquiry: object, desk: object, brandName: string } | { ok: false, field: string }>}
 */
export async function createInquiry(data, meta) {
    const { types, brandName } = await getInquiryTypes();
    const desk = types.find((type) => type.key === data.inquiryType);
    if (!desk) return { ok: false, field: "inquiryType" };

    let inquiry;
    for (let attempt = 0; attempt < 3 && !inquiry; attempt += 1) {
        try {
            inquiry = await Inquiry.create({
                reference: newReference(),
                fullName: data.fullName,
                email: data.email,
                inquiryType: desk.key,
                inquiryLabel: desk.label,
                subject: data.subject,
                message: data.message,
                meta,
            });
        } catch (error) {
            if (error?.code !== 11000) throw error; // reference collision: retry
        }
    }

    return { ok: true, inquiry: inquiry.toObject(), desk, brandName };
}

/**
 * Notify the desk and acknowledge the sender. Runs in after(), so it never
 * delays the response. Every outcome is written back to the inquiry.
 *
 * The acknowledgement deliberately echoes none of the visitor's text: an
 * auto-reply that repeats a stranger's message to an address they typed in
 * is a spam relay.
 */
export async function deliverInquiryMail({ inquiry, desk, brandName }) {
    const update = {};
    const errors = [];

    try {
        const to = desk.routeTo || fallbackInbox();
        if (!to) throw new Error("No mailbox for this desk and CONTACT_FALLBACK_INBOX is empty");

        const rows = [
            ["Reference", inquiry.reference],
            ["Desk", inquiry.inquiryLabel],
            ["Name", inquiry.fullName],
            ["Email", inquiry.email],
            ["Subject", inquiry.subject],
        ];

        await sendMail({
            to,
            replyTo: { name: inquiry.fullName, address: inquiry.email },
            subject: `[${inquiry.reference}] ${inquiry.inquiryLabel}: ${inquiry.subject}`,
            text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${inquiry.message}\n`,
            html: `<table cellpadding="4" style="font:14px/1.5 Arial,sans-serif;color:#18181b">${rows
                .map(([k, v]) => `<tr><td style="color:#71717a">${k}</td><td>${escapeHtml(v)}</td></tr>`)
                .join(
                    "",
                )}</table><p style="font:14px/1.7 Arial,sans-serif;color:#18181b;white-space:pre-wrap">${escapeHtml(
                inquiry.message,
            )}</p>`,
        });
        update["mail.deskNotifiedAt"] = new Date();
    } catch (error) {
        errors.push(`desk: ${error?.message ?? error}`);
    }

    try {
        await sendMail({
            to: inquiry.email,
            subject: `${brandName} — inquiry received (${inquiry.reference})`,
            text: [
                "Thank you for contacting us.",
                "",
                `Your inquiry has been logged with the ${inquiry.inquiryLabel} desk under reference ${inquiry.reference}.`,
                "You will hear back within two working days.",
                "",
                "This is an automated acknowledgement; please do not reply to it.",
                "",
                brandName,
            ].join("\n"),
        });
        update["mail.acknowledgedAt"] = new Date();
    } catch (error) {
        errors.push(`ack: ${error?.message ?? error}`);
    }

    if (errors.length) update["mail.error"] = errors.join(" | ").slice(0, 500);

    await connectDB();
    await Inquiry.updateOne({ _id: inquiry._id }, { $set: update });
    if (errors.length) console.error(`[inquiry ${inquiry.reference}] mail failed:`, errors.join(" | "));
}
