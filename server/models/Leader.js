import mongoose, { Schema } from "mongoose";
import { baseOptions, imageSchema, reqStr, slugField, text } from "./_shared.js";

/**
 * Leadership — About page (Office of the Chairman, Executive Leadership,
 * Non-Executive Oversight). Mirrors the Leadership contract in aboutData.js.
 *
 * `isPrincipal` separates the founding officers from the executive team. It
 * is a flag, not a third `type`, because principals are still executives for
 * every other purpose. `photo` is null for text-only board seats.
 */
const leaderSchema = new Schema(
    {
        key: slugField(),
        name: reqStr(120),
        title: reqStr(160),
        bio: text(1500),
        photo: { type: imageSchema, default: null },
        type: { type: String, enum: ["executive", "board"], required: true },
        isPrincipal: { type: Boolean, default: false },
        quote: text(600),

        order: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
    },
    baseOptions,
);

leaderSchema.index({ key: 1 }, { unique: true });
leaderSchema.index({ isPublished: 1, type: 1, order: 1 });

export const Leader = mongoose.models.Leader || mongoose.model("Leader", leaderSchema);
