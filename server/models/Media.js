import mongoose, { Schema } from "mongoose";
import { baseOptions, str } from "./_shared.js";

export const MEDIA_KINDS = Object.freeze(["image", "document"]);

/**
 * Files uploaded from the dashboard (Phase 4).
 * ---------------------------------------------------------------------------
 * The bytes live on disk under UPLOAD_DIR (server/storage/uploads.js); this
 * record is the library entry the image picker lists. Content documents do
 * not reference it by id — they store the public `url` like any other image —
 * so a file can be swapped for a pasted URL and back without a migration.
 * Deleting is refused while any document still uses the url.
 *
 * `key` is the path inside UPLOAD_DIR ("2026/10/k3j9…x.webp"): random, never
 * the visitor's filename. `originalName` is kept for the library only.
 */
const mediaSchema = new Schema(
    {
        key: { type: String, required: true, trim: true, maxlength: 200, match: /^[a-z0-9/._-]+$/ },
        url: { type: String, required: true, trim: true, maxlength: 300 },
        kind: { type: String, enum: MEDIA_KINDS, required: true },
        mime: { type: String, required: true, maxlength: 60 },
        size: { type: Number, required: true, min: 0 },
        width: { type: Number, default: null },
        height: { type: Number, default: null },
        originalName: str(200),
        /** Default alt text, copied into the image field when picked. */
        alt: str(300),
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    baseOptions,
);

mediaSchema.index({ key: 1 }, { unique: true });
mediaSchema.index({ url: 1 });
mediaSchema.index({ kind: 1, createdAt: -1 });

export const Media = mongoose.models.Media || mongoose.model("Media", mediaSchema);
