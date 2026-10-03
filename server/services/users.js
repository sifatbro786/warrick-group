import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db/connect";
import { hashPassword } from "@/server/auth/password";
import { ROLES, User } from "@/server/models";

/**
 * Dashboard user management (super_admin only — the actions authorize).
 * ---------------------------------------------------------------------------
 * Rules enforced here, not in the UI:
 *   - nobody changes their own role, deactivates themselves or resets their
 *     own password from this screen (Account page is for that);
 *   - the last active super_admin can't be demoted or deactivated;
 *   - deactivation and password resets bump tokenVersion, so the user's
 *     open sessions end on their next click.
 *
 * Every function returns { ok: true } or { ok: false, field?, message }.
 */

const LIST_FIELDS = {
    name: 1,
    email: 1,
    role: 1,
    isActive: 1,
    lockUntil: 1,
    lastLoginAt: 1,
    createdAt: 1,
};

export async function listUsers() {
    await connectDB();
    const users = await User.find({}, LIST_FIELDS).sort({ isActive: -1, role: -1, createdAt: 1 }).lean();
    const now = Date.now();
    return users.map(({ lockUntil, ...user }) => ({ ...user, locked: Boolean(lockUntil && lockUntil.getTime() > now) }));
}

const fail = (message, field) => ({ ok: false, message, ...(field ? { field } : {}) });
const NOT_FOUND = fail("That user no longer exists.");
const SELF = fail("You can't do that to your own account here. Use Account instead.");

/** True if someone other than `exceptId` is an active super_admin. */
async function anotherSuperAdminExists(exceptId) {
    const count = await User.countDocuments({
        _id: mongoose.trusted({ $ne: exceptId }),
        role: ROLES.SUPER_ADMIN,
        isActive: true,
    });
    return count > 0;
}

export async function createUser(actor, { name, email, role, password }) {
    await connectDB();
    try {
        const user = await User.create({
            name,
            email,
            role,
            passwordHash: await hashPassword(password),
            passwordChangedAt: new Date(),
            createdBy: actor.id,
        });
        return { ok: true, user: { _id: user._id, email: user.email, role: user.role } };
    } catch (error) {
        if (error?.code === 11000) return fail("An account with this email already exists.", "email");
        throw error;
    }
}

export async function updateUser(actor, id, { name, role }) {
    await connectDB();
    const user = await User.findById(id, { role: 1, isActive: 1, email: 1 }).lean();
    if (!user) return NOT_FOUND;

    if (role !== user.role) {
        if (id === actor.id) return fail("You can't change your own role.", "role");
        if (user.role === ROLES.SUPER_ADMIN && user.isActive && !(await anotherSuperAdminExists(id))) {
            return fail("This is the last super admin. Promote someone else first.", "role");
        }
    }

    await User.updateOne({ _id: id }, { $set: { name, role } }, { runValidators: true });
    return { ok: true, user };
}

export async function setUserActive(actor, id, active) {
    if (id === actor.id) return SELF;
    await connectDB();
    const user = await User.findById(id, { role: 1, isActive: 1, email: 1 }).lean();
    if (!user) return NOT_FOUND;

    if (!active && user.role === ROLES.SUPER_ADMIN && !(await anotherSuperAdminExists(id))) {
        return fail("This is the last super admin and can't be deactivated.");
    }

    await User.updateOne(
        { _id: id },
        active
            ? { $set: { isActive: true, failedLogins: 0, lockUntil: null } }
            : { $set: { isActive: false }, $inc: { tokenVersion: 1 } },
    );
    return { ok: true, user };
}

/** Sets a new password, unlocks, and ends the user's sessions. */
export async function resetUserPassword(actor, id, { password }) {
    if (id === actor.id) return SELF;
    await connectDB();
    const user = await User.findById(id, { email: 1 }).lean();
    if (!user) return NOT_FOUND;

    await User.updateOne(
        { _id: id },
        {
            $set: {
                passwordHash: await hashPassword(password),
                passwordChangedAt: new Date(),
                failedLogins: 0,
                lockUntil: null,
            },
            $inc: { tokenVersion: 1 },
        },
    );
    return { ok: true, user };
}

export async function unlockUser(id) {
    await connectDB();
    const user = await User.findOneAndUpdate(
        { _id: id },
        { $set: { failedLogins: 0, lockUntil: null } },
        { projection: { email: 1 }, lean: true },
    );
    return user ? { ok: true, user } : NOT_FOUND;
}
