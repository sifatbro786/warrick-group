import { Schema } from "mongoose";
import { FOCAL, SAFE_HREF, SAFE_SRC, SLUG } from "../validators/patterns.js";

/**
 * Shared schema building blocks.
 * ---------------------------------------------------------------------------
 * Every content model is assembled from these, so a rule like "links may not
 * be javascript: URLs" is defined once and holds everywhere an admin can type
 * a URL.
 *
 * Display ordinals ("01", "02"…) are NOT stored. They are derived from array
 * position / `order` at render time, so reordering in the dashboard can never
 * leave two items both labelled "02".
 */

/* ---- Field helpers ------------------------------------------------------ */

export const str = (max = 500, extra = {}) => ({ type: String, trim: true, maxlength: max, ...extra });
export const reqStr = (max = 500, extra = {}) => str(max, { required: true, ...extra });
export const text = (max = 5000, extra = {}) => str(max, extra);

/** Ordered paragraphs of plain text. Rendered as text, never as HTML. */
export const paragraphs = (maxEach = 3000) => ({
    type: [{ type: String, trim: true, maxlength: maxEach }],
    default: [],
});

export const slugField = () => ({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 120,
    match: [SLUG, "Slug may only contain a-z, 0-9 and single hyphens"],
});

/* ---- URL safety --------------------------------------------------------- */

/* The patterns live in validators/patterns.js so the dashboard's Zod schemas
   and these models enforce exactly the same rule. Re-exported for callers
   that imported them from here. */
export { SAFE_HREF, SAFE_SRC };

export const href = (extra = {}) => str(500, { match: [SAFE_HREF, "Invalid link"], ...extra });
export const src = (extra = {}) => str(1000, { match: [SAFE_SRC, "Invalid image or file path"], ...extra });

/* ---- Sub-documents ------------------------------------------------------ */

const opts = { _id: false };

/** `focal` is a CSS object-position value, e.g. "center 35%". */
export const imageSchema = new Schema(
    {
        url: src({ required: true }),
        alt: str(300),
        focal: str(40, { default: "center", match: [FOCAL, "Invalid focal point"] }),
    },
    opts,
);

export const linkSchema = new Schema({ label: reqStr(120), path: href({ required: true }) });

/** Eyebrow + heading + optional intro. Used for every section header. */
export const headingSchema = new Schema(
    { eyebrow: str(120), title: str(300), intro: text(2000) },
    opts,
);

/** Title + detail pair: pillars, values, clauses, capabilities, steps. */
export const pointSchema = new Schema({ title: reqStr(200), detail: text(2000) });

/** A figure: "$250M" + "+" or "18" + "%". */
export const metricSchema = new Schema({
    label: reqStr(120),
    value: reqStr(40),
    unit: str(20, { default: "" }),
    detail: text(500),
});

/** Per-document SEO override. Empty fields fall back to page/global SEO. */
export const seoOverrideSchema = new Schema(
    {
        title: str(70),
        description: str(170),
        ogImage: src(),
        noindex: { type: Boolean, default: false },
    },
    opts,
);

/* ---- Common options ----------------------------------------------------- */

/**
 * `id` virtual off (we expose `_id`), `__v` hidden in JSON, timestamps on.
 * `minimize: false` keeps empty objects such as `website: {}` from vanishing.
 */
export const baseOptions = {
    id: false,
    timestamps: true,
    minimize: false,
    toJSON: { versionKey: false },
    toObject: { versionKey: false },
};
