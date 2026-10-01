import mongoose, { Schema } from "mongoose";
import { baseOptions, reqStr, slugField } from "./_shared.js";

/**
 * Newsroom filter categories. `key` is the URL value (/news?category=key).
 * "all" is a view-level sentinel and is never stored.
 */
const newsCategorySchema = new Schema(
    {
        key: { ...slugField(), validate: { validator: (v) => v !== "all", message: '"all" is reserved' } },
        label: reqStr(60),
        order: { type: Number, default: 0 },
    },
    baseOptions,
);

newsCategorySchema.index({ key: 1 }, { unique: true });
newsCategorySchema.index({ order: 1 });

export const NewsCategory =
    mongoose.models.NewsCategory || mongoose.model("NewsCategory", newsCategorySchema);
