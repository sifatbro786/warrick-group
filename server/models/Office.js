import mongoose, { Schema } from "mongoose";
import { baseOptions, reqStr, slugField, str } from "./_shared.js";

/**
 * Offices — contact page (head office, hubs, schematic map, Google map) and
 * the footer head-office block. One record per office: the map plots
 * `coordinates` directly, so there is no second list of pins to maintain.
 *
 * `phone` is E.164 (what `tel:` dials); `phoneDisplay` is what reads.
 */
const officeSchema = new Schema(
    {
        key: slugField(),
        city: reqStr(80),
        role: str(120),
        address: {
            type: [{ type: String, trim: true, maxlength: 160 }],
            validate: [(v) => v.length > 0 && v.length <= 6, "1–6 address lines"],
        },
        email: str(254, { lowercase: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"] }),
        phone: str(20, { match: [/^\+[1-9]\d{6,14}$/, "Phone must be E.164, e.g. +442079460112"] }),
        phoneDisplay: str(30),
        coordinates: {
            lat: { type: Number, min: -90, max: 90, required: true },
            lng: { type: Number, min: -180, max: 180, required: true },
        },
        isHeadquarters: { type: Boolean, default: false },

        order: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
    },
    baseOptions,
);

officeSchema.index({ key: 1 }, { unique: true });
officeSchema.index({ isPublished: 1, order: 1 });
/* At most one head office. */
officeSchema.index(
    { isHeadquarters: 1 },
    { unique: true, partialFilterExpression: { isHeadquarters: true } },
);

export const Office = mongoose.models.Office || mongoose.model("Office", officeSchema);
