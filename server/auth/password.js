import { hash, verify } from "@node-rs/argon2";

/**
 * Password hashing — argon2id with the OWASP-recommended baseline
 * (m=19 MiB, t=2, p=1), which are also the library defaults. Pinned here so
 * a library default change can never silently weaken new hashes.
 *
 * Not marked server-only because the seed script (plain Node) uses it too.
 */
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

/* The password policy lives with the schemas (shared with the admin forms). */
export { PASSWORD_MIN_LENGTH } from "../validators/auth.js";

export const hashPassword = (plain) => hash(plain, OPTIONS);

/** Constant-time compare; never throws on a malformed hash. */
export async function verifyPassword(hashed, plain) {
    if (!hashed || !plain) return false;
    try {
        return await verify(hashed, plain);
    } catch {
        return false;
    }
}
