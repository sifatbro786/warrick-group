import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { securityEnv } from "@/server/env";

/**
 * Who is asking. The client IP comes from the proxy headers: Vercel sets
 * x-forwarded-for, and on the VPS Nginx must be configured to set it
 * (`proxy_set_header X-Forwarded-For $remote_addr;` — overwrite, not append,
 * so a client cannot spoof the first hop).
 *
 * The raw IP is never stored; only a salted hash.
 */
export async function getRequestMeta() {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || h.get("x-real-ip")?.trim() || "unknown";
    const { IP_HASH_SALT } = securityEnv();

    return {
        ipHash: createHash("sha256").update(`${IP_HASH_SALT}:${ip}`).digest("hex").slice(0, 32),
        userAgent: (h.get("user-agent") ?? "").slice(0, 300) || null,
    };
}
