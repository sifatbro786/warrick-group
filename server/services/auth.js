import "server-only";
import { connectDB } from "@/server/db/connect";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { User } from "@/server/models";
import { hitRateLimit } from "./rate-limit";

/**
 * Credential checks and password changes.
 * ---------------------------------------------------------------------------
 * Two independent brakes on guessing:
 *   1. per IP   — 20 attempts / 15 min (rate-limit collection), stops one
 *                 machine spraying many accounts;
 *   2. per user — 5 consecutive failures lock the account for 15 min
 *                 (User.failedLogins / lockUntil), stops a botnet focusing
 *                 on one account from many IPs.
 * Unknown emails and wrong passwords cost the same argon2 verify, so
 * response time doesn't reveal which emails have accounts.
 */

const IP_LIMIT = 20;
const IP_WINDOW_MS = 15 * 60 * 1000;
export const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

let dummyHash;
/* Verified against when the email is unknown, to equalise timing. */
const getDummyHash = () => (dummyHash ??= hashPassword(`timing-pad-${Math.random()}`));

const minutes = (ms) => Math.max(1, Math.ceil(ms / 60_000));

/**
 * @param {{ email: string, password: string }} credentials  already Zod-validated
 * @param {{ ipHash: string }} meta
 * @returns {Promise<
 *   | { ok: true, user: { _id: unknown, email: string, tokenVersion: number } }
 *   | { ok: false, reason: "invalid" }
 *   | { ok: false, reason: "throttled" | "locked", retryMinutes: number }>}
 */
export async function authenticate({ email, password }, meta) {
    const ip = await hitRateLimit(`login:ip:${meta.ipHash}`, IP_LIMIT, IP_WINDOW_MS);
    if (!ip.allowed) return { ok: false, reason: "throttled", retryMinutes: minutes(ip.retryAfterSec * 1000) };

    await connectDB();
    const user = await User.findOne({ email }).select("+passwordHash").lean();

    if (!user) {
        await verifyPassword(await getDummyHash(), password);
        return { ok: false, reason: "invalid" };
    }

    const now = Date.now();
    if (user.lockUntil && user.lockUntil.getTime() > now) {
        return { ok: false, reason: "locked", retryMinutes: minutes(user.lockUntil.getTime() - now) };
    }

    if (!(await verifyPassword(user.passwordHash, password))) {
        /* Atomic so parallel guesses can't each read "4 failures" and slip past. */
        const after = await User.findOneAndUpdate(
            { _id: user._id },
            { $inc: { failedLogins: 1 } },
            { returnDocument: "after", projection: { failedLogins: 1 }, lean: true },
        );
        if ((after?.failedLogins ?? 0) >= LOCK_AFTER) {
            await User.updateOne(
                { _id: user._id },
                { $set: { failedLogins: 0, lockUntil: new Date(now + LOCK_MS) } },
            );
            return { ok: false, reason: "locked", retryMinutes: minutes(LOCK_MS) };
        }
        return { ok: false, reason: "invalid" };
    }

    /* Checked after the password so a deactivated account looks exactly like
       a wrong password to whoever is typing. */
    if (!user.isActive) return { ok: false, reason: "invalid" };

    await User.updateOne(
        { _id: user._id },
        { $set: { failedLogins: 0, lockUntil: null, lastLoginAt: new Date(now) } },
    );
    return { ok: true, user: { _id: user._id, email: user.email, tokenVersion: user.tokenVersion } };
}

/**
 * Change your own password. Bumps tokenVersion (every other session of this
 * user ends) and returns the new version so the caller can re-issue its own
 * cookie.
 * @returns {Promise<{ ok: true, user: { _id: unknown, tokenVersion: number } } | { ok: false, field: string, message: string }>}
 */
export async function changeOwnPassword(userId, { currentPassword, password }) {
    const limit = await hitRateLimit(`password:user:${userId}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
        return { ok: false, field: "currentPassword", message: "Too many attempts. Try again in a few minutes." };
    }

    await connectDB();
    const user = await User.findById(userId).select("+passwordHash").lean();
    if (!user || !(await verifyPassword(user.passwordHash, currentPassword))) {
        return { ok: false, field: "currentPassword", message: "That isn't your current password." };
    }

    const updated = await User.findOneAndUpdate(
        { _id: user._id },
        {
            $set: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() },
            $inc: { tokenVersion: 1 },
        },
        { returnDocument: "after", projection: { tokenVersion: 1 }, lean: true },
    );
    return { ok: true, user: updated };
}

/** Ends every session of the user, including the caller's. */
export async function revokeAllSessions(userId) {
    await connectDB();
    await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

export async function updateOwnProfile(userId, { name }) {
    await connectDB();
    await User.updateOne({ _id: userId }, { $set: { name } }, { runValidators: true });
}

/** Account page: details the session object doesn't carry. */
export async function getOwnAccount(userId) {
    await connectDB();
    return User.findById(userId, {
        name: 1,
        email: 1,
        role: 1,
        lastLoginAt: 1,
        passwordChangedAt: 1,
        createdAt: 1,
    }).lean();
}
