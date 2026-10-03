import { z } from "zod";

/**
 * Building blocks shared by every validator. Plain Zod, no server imports:
 * Client Components import these schemas for instant feedback, Server
 * Actions run the same schema as the real check.
 */

/** Flatten Zod issues to `{ field: firstMessage }` for the form. */
export function fieldErrors(error) {
    const out = {};
    for (const issue of error.issues) {
        const key = issue.path[0];
        if (key && !out[key]) out[key] = issue.message;
    }
    return out;
}

const NO_NEWLINES = /^[^\r\n]*$/;

export const singleLine = (max, required) =>
    z
        .string()
        .trim()
        .min(1, required)
        .max(max, `Keep this under ${max} characters.`)
        .regex(NO_NEWLINES, "Line breaks are not allowed here.");

export const emailField = z
    .string()
    .trim()
    .min(1, "Enter an email address.")
    .max(254, "That email address is too long.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "That email address does not look complete.")
    .transform((value) => value.toLowerCase());

/** Mongo ObjectId as a string. Anything else never reaches a query. */
export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id.");
