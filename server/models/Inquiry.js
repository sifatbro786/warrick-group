import mongoose, { Schema } from "mongoose";
import { baseOptions, reqStr, str } from "./_shared.js";

/**
 * Contact-form submissions.
 * ---------------------------------------------------------------------------
 * Saved BEFORE any mail is sent, so an SMTP outage never loses a lead; the
 * `mail` block records what was delivered and the dashboard can show
 * failures. `ipHash` is a salted hash, never the raw IP.
 */
const inquirySchema = new Schema(
    {
        reference: reqStr(24),
        fullName: reqStr(120),
        email: reqStr(254, { lowercase: true }),
        inquiryType: reqStr(60),
        inquiryLabel: str(120),
        subject: reqStr(200),
        message: reqStr(5000),

        status: { type: String, enum: ["new", "read", "archived"], default: "new" },

        mail: {
            deskNotifiedAt: { type: Date, default: null },
            acknowledgedAt: { type: Date, default: null },
            error: { type: String, default: null, maxlength: 500 },
        },
        meta: {
            ipHash: { type: String, default: null },
            userAgent: { type: String, default: null, maxlength: 300 },
        },
    },
    baseOptions,
);

inquirySchema.index({ reference: 1 }, { unique: true });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ createdAt: -1 });

export const Inquiry = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);
