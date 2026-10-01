import mongoose, { Schema } from "mongoose";

/**
 * Fixed-window rate-limit counters (login, contact form).
 * ---------------------------------------------------------------------------
 * Stored in MongoDB rather than process memory because Vercel runs many
 * instances and an in-memory counter resets per instance. The TTL index
 * deletes a window once it expires, so the collection stays tiny.
 *
 * key example: "login:ip:<hash>" or "contact:ip:<hash>".
 */
const rateLimitSchema = new Schema(
    {
        key: { type: String, required: true, maxlength: 200 },
        count: { type: Number, default: 0 },
        expiresAt: { type: Date, required: true },
    },
    { versionKey: false },
);

rateLimitSchema.index({ key: 1 }, { unique: true });
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);
