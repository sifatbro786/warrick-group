import mongoose, { Schema } from "mongoose";
import { baseOptions, reqStr, src, str } from "./_shared.js";

/**
 * Sustainability disclosures — the downloads list on /sustainability.
 *
 * `fileUrl` points at /uploads/… once the PDF is uploaded from the dashboard.
 * The seeded values are the paths the React site used; those PDFs do not
 * exist yet, so the links 404 until the real files are uploaded.
 */
const reportSchema = new Schema(
    {
        title: reqStr(200),
        category: str(60),
        period: str(60),
        format: str(10, { default: "PDF" }),
        fileSize: str(20),
        pages: { type: Number, min: 0, default: null },
        fileUrl: src({ required: true }),
        publishedAt: { type: Date, required: true },

        order: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
    },
    baseOptions,
);

reportSchema.index({ isPublished: 1, order: 1 });

export const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
