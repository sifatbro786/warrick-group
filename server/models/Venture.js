import mongoose, { Schema } from "mongoose";
import { baseOptions, imageSchema, paragraphs, reqStr, slugField, str, text } from "./_shared.js";

export const VENTURE_STAGES = Object.freeze([
    { id: "research", label: "Research" },
    { id: "pilot", label: "Pilot" },
    { id: "scaling", label: "Scaling" },
]);

/**
 * Innovation programmes — the grid + dialog on /innovation.
 * Mirrors the Venture contract in innovationData.js. List queries project
 * `-detail`; the dialog hydrates it.
 */
const milestoneSchema = new Schema({ label: reqStr(120), value: reqStr(40) });

const ventureSchema = new Schema(
    {
        slug: slugField(),
        name: reqStr(160),
        stage: { type: String, enum: VENTURE_STAGES.map((s) => s.id), required: true },
        sector: str(160),
        established: str(4, { match: [/^\d{4}$/, "Year must be 4 digits"] }),
        location: str(160),
        leadEntity: str(120),
        summary: text(800),
        coverImage: { type: imageSchema, required: true },
        detail: {
            overview: paragraphs(),
            milestones: { type: [milestoneSchema], default: [] },
            partners: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
        },

        order: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
    },
    baseOptions,
);

ventureSchema.index({ slug: 1 }, { unique: true });
ventureSchema.index({ isPublished: 1, order: 1 });

export const Venture = mongoose.models.Venture || mongoose.model("Venture", ventureSchema);
