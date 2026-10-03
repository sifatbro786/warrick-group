import "server-only";
import nodemailer from "nodemailer";
import { mailEnv } from "@/server/env";

/**
 * SMTP transport, created once per process. Throws a readable error from
 * mailEnv() when SMTP_* is not configured; callers record that on the
 * inquiry instead of failing the visitor's submission.
 */
let transport;

function getTransport() {
    if (transport) return transport;
    const env = mailEnv();
    transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        /* Fail fast: this runs in after(), but a hung socket still holds the
           function open on Vercel. */
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
    });
    return transport;
}

/** `{ name, address }` for the From header, sending as the SMTP account. */
export function fromAddress() {
    const env = mailEnv();
    return { name: env.MAIL_FROM_NAME, address: env.SMTP_USER };
}

export function fallbackInbox() {
    return mailEnv().CONTACT_FALLBACK_INBOX || null;
}

/** @param {import("nodemailer").SendMailOptions} message */
export async function sendMail(message) {
    return getTransport().sendMail({ from: fromAddress(), ...message });
}

/** Escape user text for the HTML part of an email. */
export const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

/**
 * Settings → "Send a test email". Verifies the SMTP login first so a bad
 * password reads as a login problem, not a delivery one.
 * @returns {Promise<{ ok: true } | { ok: false, message: string }>}
 */
export async function sendTestMail(to, brandName = "Warrick Group") {
    let transporter;
    try {
        transporter = getTransport();
    } catch (error) {
        return { ok: false, message: String(error?.message ?? error).split("\n")[0] || "SMTP is not configured." };
    }
    try {
        await transporter.verify();
    } catch (error) {
        return { ok: false, message: `The mail server refused the connection or login: ${smtpReason(error)}` };
    }
    try {
        await sendMail({
            to,
            subject: `${brandName} — test email from the dashboard`,
            text: `This is a test message from the ${brandName} dashboard.\n\nIf you can read it, contact-form notifications can be delivered.`,
        });
        return { ok: true };
    } catch (error) {
        return { ok: false, message: `The mail server accepted the login but did not deliver: ${smtpReason(error)}` };
    }
}

/* Short, credential-free reason for the admin. */
const smtpReason = (error) =>
    String(error?.response ?? error?.message ?? "unknown error")
        .replace(/\s+/g, " ")
        .slice(0, 200);
