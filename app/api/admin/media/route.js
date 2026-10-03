import { getCurrentUser } from "@/server/auth/dal";
import { audit } from "@/server/services/audit";
import { ingestUpload } from "@/server/services/media";
import { hitRateLimit } from "@/server/services/rate-limit";
import { maxUploadBytes, uploadsWritable } from "@/server/storage/uploads";

/**
 * POST /api/admin/media — dashboard upload (multipart, field "file").
 * ---------------------------------------------------------------------------
 * A Route Handler rather than a Server Action: actions cap bodies at 1 MB and
 * raising that would raise it for the public contact form too. It sits
 * outside /admin so proxy.js doesn't buffer the body.
 *
 * Auth: the DAL session check, same as every action.
 * CSRF: the session cookie is SameSite=Lax (not sent on cross-site POSTs)
 * and the request must carry X-WG-Upload, which a cross-site form can't set
 * and a cross-site fetch can't send without a CORS preflight we never allow.
 */

const json = (body, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

export async function POST(request) {
    const fetchSite = request.headers.get("sec-fetch-site");
    if (request.headers.get("x-wg-upload") !== "1" || (fetchSite && fetchSite !== "same-origin")) {
        return json({ message: "Forbidden." }, 403);
    }

    const user = await getCurrentUser();
    if (!user) return json({ message: "Your session has ended. Sign in again." }, 401);

    if (!uploadsWritable()) {
        return json({ message: "Uploads are turned off on this host (Vercel's disk is read-only). Paste an image URL instead." }, 503);
    }

    const max = maxUploadBytes();
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > max + 64 * 1024) return json({ message: tooBig(max) }, 413);

    const limit = await hitRateLimit(`upload:user:${user.id}`, 60, 10 * 60 * 1000);
    if (!limit.allowed) return json({ message: "Too many uploads in a short time. Wait a few minutes." }, 429);

    let form;
    try {
        form = await request.formData();
    } catch {
        return json({ message: "The upload was interrupted. Try again." }, 400);
    }

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return json({ message: "Choose a file to upload." }, 400);
    if (file.size > max) return json({ message: tooBig(max) }, 413);

    const buffer = Buffer.from(await file.arrayBuffer());
    let result;
    try {
        result = await ingestUpload(user, { buffer, name: file.name, alt: form.get("alt") ?? "" });
    } catch (error) {
        console.error("[upload] failed:", error);
        return json({ message: "The file couldn't be saved. Check the server's disk space and permissions." }, 500);
    }
    if (!result.ok) return json({ message: result.message }, result.status);

    await audit(user, {
        action: "upload",
        entity: "Media",
        entityId: result.media._id,
        summary: `Uploaded ${result.media.originalName || result.media.key}`,
    });
    return json({ media: result.media }, 201);
}

const tooBig = (max) => `That file is larger than ${Math.round(max / 1024 / 1024)} MB.`;
