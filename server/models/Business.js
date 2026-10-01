import mongoose, { Schema } from "mongoose";
import {
    baseOptions,
    href,
    imageSchema,
    metricSchema,
    paragraphs,
    pointSchema,
    reqStr,
    seoOverrideSchema,
    slugField,
    str,
    text,
} from "./_shared.js";

/**
 * Operating companies — /businesses and /businesses/[slug].
 * Mirrors the Entity contract in warrick-frontend/src/data/businessesData.js.
 *
 * `website` and `detail.operations` are nullable on purpose: the detail page
 * skips the band they drive instead of printing an empty one.
 * `website.status: 'pending'` prints the domain as text with a launch note
 * instead of a live link.
 */

const websiteSchema = new Schema(
    {
        url: href({ required: true }),
        display: reqStr(120),
        status: { type: String, enum: ["live", "pending"], default: "live" },
    },
    { _id: false },
);

const operationsSchema = new Schema(
    {
        eyebrow: str(120),
        title: str(300),
        intro: text(2000),
        steps: { type: [pointSchema], default: [] },
    },
    { _id: false },
);

const detailSchema = new Schema(
    {
        lead: text(2000),
        narrative: paragraphs(),
        metrics: { type: [metricSchema], default: [] },
        capabilities: { type: [pointSchema], default: [] },
        operations: { type: operationsSchema, default: null },
    },
    { _id: false },
);

const businessSchema = new Schema(
    {
        slug: slugField(),
        name: reqStr(120),
        sector: reqStr(160),
        /** Short line under the name in the "Our Businesses" nav dropdown. */
        descriptor: str(160),
        tagline: str(300),
        summary: text(1000),
        established: str(4, { match: [/^\d{4}$/, "Year must be 4 digits"] }),
        headquarters: str(160),
        headcount: str(40),
        type: { type: String, enum: ["parent", "operating"], default: "operating" },
        ownership: str(160),
        coverImage: { type: imageSchema, required: true },
        website: { type: websiteSchema, default: null },
        detail: { type: detailSchema, default: () => ({}) },

        seo: { type: seoOverrideSchema, default: () => ({}) },
        order: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
    },
    baseOptions,
);

businessSchema.index({ slug: 1 }, { unique: true });
businessSchema.index({ isPublished: 1, order: 1 });

export const Business = mongoose.models.Business || mongoose.model("Business", businessSchema);
