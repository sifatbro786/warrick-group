import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { resolveKey, statUpload } from "@/server/storage/uploads";

/**
 * GET /uploads/… — serves dashboard uploads from UPLOAD_DIR.
 * ---------------------------------------------------------------------------
 * On the VPS, Nginx serves the folder directly and this never runs (same
 * headers in the Nginx snippet in PHASES.md). Names are random and never
 * reused, so responses are cacheable forever.
 *
 * Only extensions the uploader writes are served, with their real type,
 * nosniff and a locked-down CSP: even a crafted file can't run script here.
 */

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(_request, { params }) {
    const { path: segments } = await params;
    const file = resolveKey(segments);
    if (!file) return notFound();

    const info = await statUpload(file);
    if (!info) return notFound();

    const isPdf = file.ext === "pdf";
    const body = Readable.toWeb(createReadStream(file.path));
    return new Response(body, {
        headers: {
            "Content-Type": file.mime,
            "Content-Length": String(info.size),
            "Cache-Control": "public, max-age=31536000, immutable",
            "Last-Modified": info.mtime.toUTCString(),
            "X-Content-Type-Options": "nosniff",
            /* Browsers' PDF viewers break under `sandbox`; images get it. */
            "Content-Security-Policy": isPdf
                ? "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; object-src 'self'"
                : "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
            "Content-Disposition": "inline",
            "Cross-Origin-Resource-Policy": "same-site",
        },
    });
}
