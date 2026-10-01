import { z } from "zod";

/**
 * Contact form schema — the server-side truth. The client runs the same
 * rules (components/contact/rules.js) only so people are not told about a
 * typo by a round trip; this is what actually decides.
 *
 * Single-line fields reject CR/LF outright: they end up in mail headers
 * (subject, reply-to name) and a newline there is header injection, not a
 * typo. Nodemailer encodes headers too; this is the first line, not the only.
 */
const NO_NEWLINES = /^[^\r\n]*$/;

const singleLine = (max, required) =>
    z
        .string()
        .trim()
        .min(1, required)
        .max(max, `Keep this under ${max} characters.`)
        .regex(NO_NEWLINES, "Line breaks are not allowed here.");

export const contactSchema = z.object({
    fullName: singleLine(120, "Enter your full name."),
    email: z
        .string()
        .trim()
        .min(1, "Enter a corporate email address.")
        .max(254, "That email address is too long.")
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "That email address does not look complete.")
        .transform((value) => value.toLowerCase()),
    inquiryType: z
        .string()
        .trim()
        .min(1, "Select an inquiry type.")
        .max(60)
        .regex(/^[a-z0-9-]+$/, "Select an inquiry type."),
    subject: singleLine(200, "Add a subject line."),
    message: z
        .string()
        .trim()
        .min(20, "Give us at least a couple of sentences to route this properly.")
        .max(5000, "Keep the message under 5,000 characters."),
    /* Honeypot. Real people never see or fill it. */
    website: z.string().max(200).optional().default(""),
});

/** Flatten Zod issues to `{ field: firstMessage }` for the form. */
export function fieldErrors(error) {
    const out = {};
    for (const issue of error.issues) {
        const key = issue.path[0];
        if (key && !out[key]) out[key] = issue.message;
    }
    return out;
}
