import "server-only";
import { connectDB } from "@/server/db/connect";
import { AuditLog } from "@/server/models";

/**
 * Append-only activity trail (TTL 365 days). Never throws: a failed audit
 * write must not fail the action it records.
 *
 * @param {{ id?: string, email?: string } | null} actor
 * @param {{ action: string, entity: string, entityId?: string|null, summary?: string }} entry
 */
export async function audit(actor, { action, entity, entityId = null, summary = "" }) {
    try {
        await connectDB();
        await AuditLog.create({
            actor: actor?.id ?? null,
            actorEmail: actor?.email ?? null,
            action,
            entity,
            entityId: entityId ? String(entityId) : null,
            summary: summary.slice(0, 300),
        });
    } catch (error) {
        console.error("[audit] write failed:", error?.message ?? error);
    }
}

/** Latest entries for the overview. */
export async function recentActivity(limit = 8) {
    await connectDB();
    return AuditLog.find({}, { actorEmail: 1, action: 1, entity: 1, summary: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
}
