/**
 * URL / text patterns shared by the Mongoose models (server, seed script) and
 * the Zod validators (browser + Server Actions). One definition, so a link the
 * dashboard form accepts is always one the database accepts too.
 *
 * No imports: this file is loaded by plain Node (seed) and by the browser.
 */

/**
 * Internal path ("/about", "/contact?type=media", "/about#board"), `#anchor`,
 * absolute http(s) URL, mailto: or tel:. Anything else — notably
 * `javascript:` and protocol-relative "//evil.com" — is rejected.
 */
export const SAFE_HREF = /^(\/(?!\/)[^\s]*|#[\w-]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d\s-]+)$/i;

/** Image/file source: local path ("/logo.png", "/uploads/…") or https URL. */
export const SAFE_SRC = /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/i;

/** URL slug: lowercase words joined by single hyphens. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Machine key (desk keys, route keys). */
export const KEY = /^[a-z0-9-]+$/;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** E.164 phone, what a `tel:` link dials. */
export const E164 = /^\+[1-9]\d{6,14}$/;

/** CSS object-position, e.g. "center 35%" or "40% 60%". */
export const FOCAL = /^[a-z0-9%.\s-]+$/i;

export const YEAR = /^\d{4}$/;
