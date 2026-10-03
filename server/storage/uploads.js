import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { uploadEnv } from "@/server/env";

/**
 * Local-disk storage for dashboard uploads.
 * ---------------------------------------------------------------------------
 * Files live in UPLOAD_DIR (default ./uploads, gitignored) under
 * "YYYY/MM/<32 random hex>.<ext>" and are served at /uploads/… by
 * app/uploads/[...path]/route.js (or by Nginx on the VPS).
 *
 * The visitor's filename never reaches the disk, the type is decided by the
 * file's own bytes (not its name or the browser's claim), and SVG/HTML are
 * not accepted at all: served from our origin they could run script.
 *
 * Everything that touches storage goes through this module, so swapping in
 * S3/R2 later means changing one file.
 */

/** Accepted types, keyed by what sniff() returns. */
export const UPLOAD_TYPES = Object.freeze({
    jpeg: { mime: "image/jpeg", ext: "jpg", kind: "image" },
    png: { mime: "image/png", ext: "png", kind: "image" },
    webp: { mime: "image/webp", ext: "webp", kind: "image" },
    avif: { mime: "image/avif", ext: "avif", kind: "image" },
    gif: { mime: "image/gif", ext: "gif", kind: "image" },
    pdf: { mime: "application/pdf", ext: "pdf", kind: "document" },
});

const MIME_BY_EXT = Object.fromEntries(Object.values(UPLOAD_TYPES).map((t) => [t.ext, t.mime]));

const ascii = (buf, start, end) => buf.subarray(start, end).toString("latin1");

/**
 * Identify a file from its leading bytes.
 * @param {Buffer} buf
 * @returns {keyof typeof UPLOAD_TYPES | null}
 */
export function sniff(buf) {
    if (!buf || buf.length < 12) return null;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return "webp";
    if (ascii(buf, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(buf, 8, 12))) return "avif";
    if (["GIF87a", "GIF89a"].includes(ascii(buf, 0, 6))) return "gif";
    if (ascii(buf, 0, 5) === "%PDF-") return "pdf";
    return null;
}

/* turbopackIgnore: the path is runtime data (UPLOAD_DIR), not a project file
   to trace — without it the build bundles the whole project into the server. */
export const uploadsRoot = () => path.resolve(/*turbopackIgnore: true*/ process.cwd(), uploadEnv().UPLOAD_DIR);

/**
 * Vercel's filesystem is read-only (and not shared between instances), so
 * the dashboard disables uploading there. UPLOADS_DISABLED=true does the same
 * anywhere else.
 */
export const uploadsWritable = () => !process.env.VERCEL && process.env.UPLOADS_DISABLED !== "true";

export const maxUploadBytes = () => Math.round(uploadEnv().UPLOAD_MAX_MB * 1024 * 1024);

/**
 * Write bytes under a fresh random name.
 * @param {Buffer} data
 * @param {string} ext   from UPLOAD_TYPES
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function storeUpload(data, ext) {
    const now = new Date();
    const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const key = `${dir}/${randomBytes(16).toString("hex")}.${ext}`;
    const root = uploadsRoot();

    await mkdir(path.join(/*turbopackIgnore: true*/ root, dir), { recursive: true });
    /* "wx": never overwrite, even on the astronomically unlikely collision. */
    await writeFile(path.join(/*turbopackIgnore: true*/ root, key), data, { flag: "wx" });
    return { key, url: `/uploads/${key}` };
}

export async function removeUpload(key) {
    const file = resolveKey(key.split("/"));
    if (file) await rm(file.path, { force: true });
}

const SEGMENT = /^[a-z0-9][a-z0-9._-]{0,99}$/i;

/**
 * URL segments → absolute path inside the uploads root, or null. Rejects
 * traversal ("..", encoded slashes), dotfiles and unknown extensions.
 * @param {string[]} segments
 */
export function resolveKey(segments) {
    if (!Array.isArray(segments) || segments.length === 0 || segments.length > 4) return null;
    if (!segments.every((s) => typeof s === "string" && SEGMENT.test(s) && !s.includes(".."))) return null;

    const ext = segments.at(-1).split(".").pop()?.toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) return null;

    const root = uploadsRoot();
    const full = path.resolve(/*turbopackIgnore: true*/ root, ...segments);
    if (!full.startsWith(root + path.sep)) return null;
    return { path: full, mime, ext };
}

/** stat() that answers null instead of throwing for a missing file. */
export async function statUpload(file) {
    try {
        const info = await stat(file.path);
        return info.isFile() ? info : null;
    } catch {
        return null;
    }
}
