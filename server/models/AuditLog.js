import mongoose, { Schema } from "mongoose";

/**
 * Who changed what. Written by the service layer on every dashboard
 * mutation (Phase 4). Expires after 365 days via TTL index.
 */
const auditLogSchema = new Schema(
    {
        actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
        actorEmail: { type: String, default: null },
        action: { type: String, required: true, maxlength: 40 }, // create | update | delete | login | …
        entity: { type: String, required: true, maxlength: 40 }, // Business | Page:home | User | …
        entityId: { type: String, default: null, maxlength: 64 },
        summary: { type: String, default: "", maxlength: 300 },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false },
);

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });
auditLogSchema.index({ entity: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
