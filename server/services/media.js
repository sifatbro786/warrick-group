import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db/connect";
import {
    Article,
    Business,
    Leader,
    Media,
    Page,
    Report,
    SeoSetting,
    SiteSettings,
    Venture,
} from "@/server/models";
import { removeUpload, sniff, storeUpload, UPLOAD_TYPES } from "@/server/storage/uploads";
import { toPlain } from "./_cache";

/**
 * Media library.
 * ---------------------------------------------------------------------------
 * Upload path: sniff the real type → re-encode images with sharp (strips
 * EXIF/GPS, fixes rotation, caps the longest edge) → random filename on disk
 * → library record. Content stores the public url, so the library is a
 * convenience index, never a dependency of the public site.
 */

export const MEDIA_PAGE_SIZE = 24;

/** Longest edge kept for photos. The hero renders up to 2560px wide. */
const MAX_EDGE = 3000;

const fail = (message, status = 400) => ({ ok: false, message, status });

/** "IMG_2041 (final).JPG" → "IMG_2041 (final).JPG", minus paths and control characters. */
const cleanName = (name) =>
    String(name ?? "")
        .split(/[\\/]/)
        .pop()
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 200);

let sharpModule;
async function loadSharp() {
    if (sharpModule === undefined) {
        try {
            sharpModule = (await import("sharp")).default;
        } catch (error) {
            console.warn("[media] sharp unavailable, images are stored as uploaded:", error?.message);
            sharpModule = null;
        }
    }
    return sharpModule;
}

/**
 * Re-encode in the same format. Output carries no metadata (sharp's default),
 * which is the point: phone photos carry GPS coordinates.
 */
async function processImage(buffer, type) {
    const sharp = await loadSharp();
    if (!sharp) return { data: buffer, width: null, height: null };

    if (type === "gif") {
        /* Animated GIFs are kept byte-for-byte; just read the size. */
        const meta = await sharp(buffer, { animated: true }).metadata();
        return { data: buffer, width: meta.width ?? null, height: meta.pageHeight ?? meta.height ?? null };
    }

    let pipeline = sharp(buffer, { failOn: "error", limitInputPixels: 80_000_000 }).rotate();
    pipeline = pipeline.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
    pipeline = {
        jpeg: () => pipeline.jpeg({ quality: 86, mozjpeg: true }),
        png: () => pipeline.png({ compressionLevel: 9 }),
        webp: () => pipeline.webp({ quality: 86 }),
        avif: () => pipeline.avif({ quality: 62 }),
    }[type]();

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
}

/**
 * @param {{ id: string }} actor
 * @param {{ buffer: Buffer, name?: string, alt?: string }} file
 * @returns {Promise<{ ok: true, media: object } | { ok: false, message: string, status: number }>}
 */
export async function ingestUpload(actor, { buffer, name, alt = "" }) {
    const type = sniff(buffer);
    if (!type) return fail("Only JPG, PNG, WebP, AVIF and GIF images or PDF documents can be uploaded.", 415);
    const info = UPLOAD_TYPES[type];

    let data = buffer;
    let width = null;
    let height = null;
    if (info.kind === "image") {
        try {
            ({ data, width, height } = await processImage(buffer, type));
        } catch {
            return fail("That image is damaged or isn't really an image file.", 415);
        }
    }

    const { key, url } = await storeUpload(data, info.ext);
    try {
        await connectDB();
        const media = await Media.create({
            key,
            url,
            kind: info.kind,
            mime: info.mime,
            size: data.length,
            width,
            height,
            originalName: cleanName(name),
            alt: String(alt ?? "").replace(/\s+/g, " ").trim().slice(0, 300),
            uploadedBy: actor.id,
        });
        return { ok: true, media: toPlain(media.toObject()) };
    } catch (error) {
        /* No orphan file if the record can't be written. */
        await removeUpload(key).catch(() => {});
        throw error;
    }
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @param {{ kind?: "image"|"document", q?: string, page?: number, withUsage?: boolean }} query
 */
export async function listMedia({ kind, q, page = 1, withUsage = false } = {}) {
    await connectDB();
    const filter = {};
    if (kind) filter.kind = kind;
    if (q) {
        const pattern = mongoose.trusted({ $regex: escapeRegex(q), $options: "i" });
        filter.$or = [{ originalName: pattern }, { alt: pattern }];
    }

    const [items, total, used] = await Promise.all([
        Media.find(filter, { uploadedBy: 0, updatedAt: 0 })
            .sort({ createdAt: -1 })
            .skip((page - 1) * MEDIA_PAGE_SIZE)
            .limit(MEDIA_PAGE_SIZE)
            .lean(),
        Media.countDocuments(filter),
        withUsage ? usedUploadUrls() : Promise.resolve(null),
    ]);

    const rows = toPlain(items).map((item) => (used ? { ...item, inUse: used.has(item.url) } : item));
    return { items: rows, total, pages: Math.max(1, Math.ceil(total / MEDIA_PAGE_SIZE)) };
}

export async function updateMediaAlt(id, alt) {
    await connectDB();
    const media = await Media.findOneAndUpdate(
        { _id: id },
        { $set: { alt } },
        { returnDocument: "after", lean: true, projection: { originalName: 1 } },
    );
    return media ? { ok: true, media } : fail("That file no longer exists.", 404);
}

export async function deleteMedia(id) {
    await connectDB();
    const media = await Media.findById(id).lean();
    if (!media) return fail("That file no longer exists.", 404);

    const usage = await findUsage(media.url);
    if (usage.length) {
        return fail(`Still used by ${usage.slice(0, 3).join(", ")}${usage.length > 3 ? ` and ${usage.length - 3} more` : ""}. Replace it there first.`, 409);
    }

    await Media.deleteOne({ _id: id });
    await removeUpload(media.key).catch((error) => console.error("[media] file delete failed:", error?.message));
    return { ok: true, media };
}

/* ---- Usage scan ------------------------------------------------------------
   Content stores image urls inside nested objects, so the scan reads the
   documents and searches their JSON. The content set is small (dozens of
   documents), so this stays cheap; it only runs on the library screen and
   before a delete. */

const SOURCES = [
    [Page, (d) => `the ${d.key} page`],
    [SiteSettings, () => "site settings"],
    [SeoSetting, (d) => `SEO for ${d.label}`],
    [Business, (d) => `business “${d.name}”`],
    [Article, (d) => `article “${d.title}”`],
    [Leader, (d) => `${d.name}'s profile`],
    [Venture, (d) => `venture “${d.name}”`],
    [Report, (d) => `report “${d.title}”`],
];

async function scan() {
    await connectDB();
    const docs = await Promise.all(SOURCES.map(([Model]) => Model.find({}).lean()));
    return docs.flatMap((rows, index) => rows.map((doc) => ({ json: JSON.stringify(doc), label: SOURCES[index][1](doc) })));
}

async function usedUploadUrls() {
    const used = new Set();
    for (const { json } of await scan()) {
        for (const match of json.matchAll(/"(\/uploads\/[^"]+)"/g)) used.add(match[1]);
    }
    return used;
}

export async function findUsage(url) {
    const needle = JSON.stringify(url);
    return (await scan()).filter(({ json }) => json.includes(needle)).map(({ label }) => label);
}
