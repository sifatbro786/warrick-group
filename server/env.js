import { z } from "zod";

/**
 * Server environment, validated once on first use.
 * ---------------------------------------------------------------------------
 * Grouped by feature so a missing SMTP password fails the contact form with a
 * clear message instead of failing `next build` for a page that never sends
 * mail. Each getter throws a readable error listing the missing keys.
 *
 * Never import this from a Client Component: nothing here is NEXT_PUBLIC.
 */

const bool = z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true");

const schemas = {
    db: z.object({
        MONGODB_URI: z
            .string()
            .min(1, "MONGODB_URI is required")
            .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),
    }),

    auth: z.object({
        JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    }),

    mail: z.object({
        SMTP_HOST: z.string().min(1),
        SMTP_PORT: z.coerce.number().int().positive().default(465),
        SMTP_SECURE: bool,
        SMTP_USER: z.string().min(1),
        SMTP_PASS: z.string().min(1),
        MAIL_FROM_NAME: z.string().default("Warrick Group"),
        CONTACT_FALLBACK_INBOX: z.email().optional().or(z.literal("")),
    }),

    uploads: z.object({
        UPLOAD_DIR: z.string().default("uploads"),
        UPLOAD_MAX_MB: z.coerce.number().positive().max(50).default(8),
    }),

    site: z.object({
        NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
    }),
};

const cache = new Map();

function load(group) {
    if (cache.has(group)) return cache.get(group);

    const result = schemas[group].safeParse(process.env);
    if (!result.success) {
        const issues = result.error.issues
            .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");
        throw new Error(`Invalid environment (${group}):\n${issues}\nSee .env.example.`);
    }

    cache.set(group, Object.freeze(result.data));
    return cache.get(group);
}

export const dbEnv = () => load("db");
export const authEnv = () => load("auth");
export const mailEnv = () => load("mail");
export const uploadEnv = () => load("uploads");
export const siteEnv = () => load("site");
