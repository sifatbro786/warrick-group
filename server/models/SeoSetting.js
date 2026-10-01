import mongoose, { Schema } from "mongoose";
import { baseOptions, reqStr, src, str } from "./_shared.js";

/**
 * Per-route SEO — the dashboard's SEO page edits these.
 * ---------------------------------------------------------------------------
 * One record per public route (home, about, businesses, …, privacy, terms).
 * Detail pages (a business, an article) take this record as the fallback
 * and apply their own `seo` override on top. Site-wide defaults (title
 * template, default OG image, verification codes) live in SiteSettings.seo.
 *
 * `sitemap` feeds app/sitemap.js, so priority/frequency are editable too.
 */
const seoSettingSchema = new Schema(
    {
        key: { type: String, required: true, trim: true, maxlength: 60, match: /^[a-z0-9-]+$/ },
        path: { type: String, required: true, trim: true, match: /^\/[a-z0-9\-/]*$/ },
        label: reqStr(80),

        title: str(70),
        description: str(170),
        keywords: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
        ogImage: src(),
        noindex: { type: Boolean, default: false },

        sitemap: {
            include: { type: Boolean, default: true },
            changeFrequency: {
                type: String,
                enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"],
                default: "monthly",
            },
            priority: { type: Number, min: 0, max: 1, default: 0.7 },
        },
    },
    baseOptions,
);

seoSettingSchema.index({ key: 1 }, { unique: true });
seoSettingSchema.index({ path: 1 }, { unique: true });

export const SeoSetting = mongoose.models.SeoSetting || mongoose.model("SeoSetting", seoSettingSchema);
