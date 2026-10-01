import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db/connect";
import { RateLimit } from "@/server/models";

/**
 * Fixed-window counter in MongoDB (works across Vercel instances).
 *
 * One atomic $inc on a live window; if there is none (first hit, or the
 * window expired and the TTL monitor has not swept it yet) the window is
 * (re)started with an upsert. Two first hits racing on the unique key: the
 * loser gets E11000 and simply retries the increment.
 *
 * @param {string} key        e.g. "contact:ip:<hash>"
 * @param {number} limit      max hits per window
 * @param {number} windowMs
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfterSec: number }>}
 */
export async function hitRateLimit(key, limit, windowMs) {
    await connectDB();
    const now = new Date();

    const increment = () =>
        RateLimit.findOneAndUpdate(
            { key, expiresAt: mongoose.trusted({ $gt: now }) },
            { $inc: { count: 1 } },
            { returnDocument: "after", lean: true },
        );

    let doc = await increment();

    if (!doc) {
        try {
            doc = await RateLimit.findOneAndUpdate(
                { key },
                { $set: { count: 1, expiresAt: new Date(now.getTime() + windowMs) } },
                { returnDocument: "after", upsert: true, lean: true },
            );
        } catch (error) {
            if (error?.code !== 11000) throw error;
            doc = await increment();
        }
    }

    const count = doc?.count ?? 1;
    const retryAfterSec = Math.max(
        1,
        Math.ceil(((doc?.expiresAt?.getTime?.() ?? now.getTime()) - now.getTime()) / 1000),
    );
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSec };
}
