import "server-only";
import mongoose from "mongoose";
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

export const ACTIVITY_PAGE_SIZE = 30;

/**
 * Activity log screen. `entity` matches the first segment ("Page" covers
 * "Page:home"); filters arrive validated by the page.
 * @param {{ entity?: string, actor?: string, page: number }} query
 */
export async function listActivity({ entity, actor, page }) {
    await connectDB();
    const filter = {};
    if (entity) filter.entity = mongoose.trusted({ $regex: `^${entity.replace(/[^A-Za-z]/g, "")}(:|$)` });
    if (actor) filter.actorEmail = actor;

    const [items, total, entities, actors] = await Promise.all([
        AuditLog.find(filter, { actorEmail: 1, action: 1, entity: 1, entityId: 1, summary: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .skip((page - 1) * ACTIVITY_PAGE_SIZE)
            .limit(ACTIVITY_PAGE_SIZE)
            .lean(),
        AuditLog.countDocuments(filter),
        AuditLog.distinct("entity"),
        AuditLog.distinct("actorEmail"),
    ]);

    return {
        items,
        total,
        pages: Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE)),
        entities: [...new Set(entities.map((e) => e.split(":")[0]))].sort(),
        actors: actors.filter(Boolean).sort(),
    };
}
