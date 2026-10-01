import mongoose, { Schema } from "mongoose";
import { baseOptions, reqStr } from "./_shared.js";

export const ROLES = Object.freeze({ SUPER_ADMIN: "super_admin", ADMIN: "admin" });

/**
 * Dashboard users.
 * ---------------------------------------------------------------------------
 * - passwordHash is argon2id and `select: false`: it never leaves a query
 *   unless explicitly asked for with .select("+passwordHash").
 * - tokenVersion is embedded in the session JWT. Bumping it (password
 *   change, deactivation, "log out everywhere") invalidates every session
 *   that user holds, without a session table.
 * - failedLogins / lockUntil drive the per-account lockout (Phase 3).
 *
 * Role rules enforced in the service layer (Phase 3), not in the UI:
 *   only super_admin manages users; nobody demotes/deactivates themselves;
 *   the last active super_admin cannot be removed.
 */
const userSchema = new Schema(
    {
        name: reqStr(80),
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 254,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"],
        },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: Object.values(ROLES), default: ROLES.ADMIN, required: true },
        isActive: { type: Boolean, default: true },

        tokenVersion: { type: Number, default: 0 },
        failedLogins: { type: Number, default: 0 },
        lockUntil: { type: Date, default: null },
        lastLoginAt: { type: Date, default: null },
        passwordChangedAt: { type: Date, default: null },

        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    {
        ...baseOptions,
        toJSON: {
            versionKey: false,
            transform: (_doc, ret) => {
                delete ret.passwordHash;
                return ret;
            },
        },
    },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
