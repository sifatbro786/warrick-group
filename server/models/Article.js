import mongoose, { Schema } from "mongoose";
import {
    baseOptions,
    imageSchema,
    paragraphs,
    reqStr,
    seoOverrideSchema,
    slugField,
    text,
} from "./_shared.js";

/**
 * Newsroom articles — /news (grid + modal) and /news/[slug].
 *
 * `content` stays an array of plain-text paragraphs, exactly like the React
 * contract. It is rendered as text, so there is no HTML to sanitise and no
 * XSS surface. If rich text is ever needed, swap to sanitised HTML here and
 * in the renderer together.
 *
 * List queries must project `-content` — the grid never needs the body.
 */
const articleSchema = new Schema(
    {
        slug: slugField(),
        title: reqStr(300),
        category: { type: Schema.Types.ObjectId, ref: "NewsCategory", required: true },
        publishedAt: { type: Date, required: true },
        readTime: { type: Number, min: 1, max: 120, default: 3 },
        summary: text(600),
        content: paragraphs(5000),
        coverImage: { type: imageSchema, required: true },

        status: { type: String, enum: ["draft", "published"], default: "published" },
        seo: { type: seoOverrideSchema, default: () => ({}) },
    },
    baseOptions,
);

articleSchema.index({ slug: 1 }, { unique: true });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ status: 1, category: 1, publishedAt: -1 });

export const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);
