import mongoose from "mongoose";
import { dbEnv } from "../env.js";

/**
 * Cached Mongoose connection.
 * ---------------------------------------------------------------------------
 * Serverless (Vercel) and `next dev` both re-evaluate modules, so the
 * connection promise lives on globalThis. Without this every hot reload or
 * cold function opens a new pool and Atlas runs out of connections.
 *
 * Pool sizing: Vercel spins up many small instances, each holding its own
 * pool, so the default of 100 per instance is far too many. 10 is plenty for
 * a content site. On the VPS (one long-lived process) it can be raised.
 */

mongoose.set("strictQuery", true);
/* Rejects query filters containing $-operators that came from user input,
   e.g. { email: { $ne: null } } posted as JSON. Defence in depth: Zod already
   rejects non-string values at the boundary. */
mongoose.set("sanitizeFilter", true);

const globalCache = globalThis.__mongoose ?? (globalThis.__mongoose = { conn: null, promise: null });

export async function connectDB() {
    if (globalCache.conn) return globalCache.conn;

    if (!globalCache.promise) {
        const { MONGODB_URI } = dbEnv();
        globalCache.promise = mongoose
            .connect(MONGODB_URI, {
                bufferCommands: false,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 10_000,
            })
            .catch((error) => {
                /* Let the next request retry instead of caching the failure. */
                globalCache.promise = null;
                throw error;
            });
    }

    globalCache.conn = await globalCache.promise;
    return globalCache.conn;
}

export async function disconnectDB() {
    if (!globalCache.conn) return;
    await mongoose.disconnect();
    globalCache.conn = null;
    globalCache.promise = null;
}
