import { z } from "zod";
import { E164, EMAIL, FOCAL, KEY, SAFE_HREF, SAFE_SRC, SLUG, YEAR } from "../patterns.js";

/**
 * CMS field DSL.
 * ===========================================================================
 * Every dashboard editor is described once as a tree of fields:
 *
 *   const fields = {
 *     title: text("Title", { required: true, max: 200 }),
 *     cover: image("Cover image", { required: true }),
 *     steps: list("Steps", { title: text("Title"), detail: textarea("Detail") }),
 *   };
 *
 * From that one description:
 *   formSchema(fields)  → the Zod schema. The browser runs it for instant
 *                          feedback; the Server Action runs it again as the
 *                          real check (plain Zod, no server imports).
 *   toForm(fields, doc) → the react-hook-form default values: every input
 *                          controlled, string lists joined into one textarea.
 *   the renderer        → components/admin/cms/FieldRenderer.js draws it.
 *
 * Limits mirror server/models: a value the form accepts is a value Mongoose
 * accepts. scripts/check-cms.js proves it by round-tripping every seed
 * document through toForm → formSchema → Mongoose validation.
 *
 * Field options shared by every type:
 *   label, hint, required, span ("full" | "half" | "third"), placeholder
 */

const NO_NEWLINES = /^[^\r\n]*$/;

/* ---- Builders ------------------------------------------------------------ */

/** @typedef {Record<string, any>} Field */
/** @typedef {Record<string, Field>} Fields */

const make = (type, defaults) => (label, options = {}) => ({ type, label, ...defaults, ...options });

/** Single line. Options: max, pattern + patternMessage, lowercase, counter: [ideal min, ideal max]. */
export const text = make("text", { max: 300 });
/** Multi-line plain text. Options: max, rows. */
export const textarea = make("textarea", { max: 2000, rows: 3 });
/** Options: min, max, int, step. Empty → null unless required. */
export const number = make("number", { int: true });
export const toggle = make("toggle", {});
/** options: [{ value, label }] */
export const select = (label, options, extra = {}) => ({ type: "select", label, options, ...extra });
/** Internal path, #anchor, https://, mailto: or tel:. */
export const link = make("link", { max: 500 });
/** { url, alt, focal } picked from the media library or pasted. */
export const image = make("image", {});
/** A file URL (PDF report, logo). Options: accept ("image" | "document"). */
export const file = make("file", { max: 1000, accept: "document" });
/** YYYY-MM-DD. Optional dates become null. */
export const date = make("date", {});
/** string[] edited as one item per line. Options: max (items), itemMax, itemPattern. */
export const lines = make("lines", { max: 20, itemMax: 300, rows: 4 });
/** string[] edited as paragraphs separated by a blank line. */
export const paragraphs = make("paragraphs", { max: 30, itemMax: 3000, rows: 8 });
/**
 * Nested object. Options: nullable (renders an on/off switch; off saves null),
 * flatten (visual grouping only — the fields belong to the parent object),
 * collapsible, description.
 */
export const group = (label, fields, extra = {}) => ({ type: "group", label, fields, ...extra });
/** Array of objects with add / remove / reorder. Options: max, min, unique (field that must differ per row), summary (field name(s) for the collapsed row), itemLabel. */
export const list = (label, fields, extra = {}) => ({ type: "list", label, fields, max: 50, ...extra });
/** Select whose options come from the database at render time (ctx.refs[source]). */
export const ref = (label, source, extra = {}) => ({ type: "ref", label, source, ...extra });

/* Convenience variants with the model's pattern baked in. */
export const slug = (label = "URL slug", extra = {}) =>
    text(label, {
        max: 120,
        required: true,
        lowercase: true,
        pattern: SLUG,
        patternMessage: "Use lowercase letters, numbers and single hyphens, e.g. warrick-motors.",
        mono: true,
        ...extra,
    });
export const key = (label, extra = {}) =>
    text(label, { max: 60, required: true, lowercase: true, pattern: KEY, patternMessage: "Use a-z, 0-9 and hyphens only.", mono: true, ...extra });
export const email = (label, extra = {}) =>
    text(label, { max: 254, lowercase: true, pattern: EMAIL, patternMessage: "That email address doesn't look complete.", ...extra });
export const phone = (label, extra = {}) =>
    text(label, { max: 20, pattern: E164, patternMessage: "International format with no spaces, e.g. +442079460112.", mono: true, ...extra });
export const year = (label, extra = {}) =>
    text(label, { max: 4, pattern: YEAR, patternMessage: "Four digits, e.g. 2016.", span: "third", ...extra });

/* ---- Zod ----------------------------------------------------------------- */

const REQUIRED = "This field is required.";
const tooLong = (max) => `Keep this under ${max} characters.`;
const blankToNull = (value) => (value === "" || value === undefined ? null : value);

function stringSchema(field, { multiline = false, pattern = field.pattern, patternMessage = field.patternMessage } = {}) {
    let schema = z.string().trim().max(field.max, tooLong(field.max));
    if (!multiline) schema = schema.regex(NO_NEWLINES, "Line breaks are not allowed here.");
    if (field.required) schema = schema.min(1, field.requiredMessage ?? REQUIRED);
    if (pattern) schema = schema.refine((value) => value === "" || pattern.test(value), patternMessage ?? "Invalid value.");
    if (field.reserved) schema = schema.refine((value) => !field.reserved.includes(value.toLowerCase()), "That value is reserved.");
    if (field.lowercase) schema = schema.transform((value) => value.toLowerCase());
    return z.preprocess((value) => (value == null ? "" : typeof value === "number" ? String(value) : value), schema);
}

/** Split a textarea into items, collapsing per-item whitespace. */
function splitter(kind) {
    return (value) => {
        if (Array.isArray(value)) return value;
        const raw = String(value ?? "");
        const parts = kind === "paragraphs" ? raw.split(/\n\s*\n/) : raw.split(/\r?\n/);
        return parts.map((part) => part.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
    };
}

/**
 * Item errors are reported on the field itself ("Line 3 is too long"), not
 * on "field.2": the form shows one textarea, not one input per item.
 */
function stringListSchema(field, kind) {
    const noun = kind === "paragraphs" ? "Paragraph" : "Line";
    return z.preprocess(
        splitter(kind),
        z.array(z.string()).superRefine((items, ctx) => {
            if (field.required && items.length === 0) ctx.addIssue({ code: "custom", message: REQUIRED });
            if (items.length > field.max) ctx.addIssue({ code: "custom", message: `Keep this to ${field.max} ${noun.toLowerCase()}s or fewer.` });
            items.forEach((item, index) => {
                if (item.length > field.itemMax) {
                    ctx.addIssue({ code: "custom", message: `${noun} ${index + 1} is longer than ${field.itemMax} characters.` });
                } else if (field.itemPattern && !field.itemPattern.test(item)) {
                    ctx.addIssue({ code: "custom", message: `${noun} ${index + 1}: ${field.itemPatternMessage ?? "invalid value."}` });
                }
            });
        }),
    );
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (value) => DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** @param {Field} field */
export function fieldSchema(field) {
    switch (field.type) {
        case "text":
            return stringSchema(field);
        case "textarea":
            return stringSchema(field, { multiline: true });
        case "link":
            return stringSchema(field, {
                pattern: SAFE_HREF,
                patternMessage: "Use a site path like /about, a full https:// address, mailto: or tel:.",
            });
        case "file":
            return stringSchema({ ...field, requiredMessage: "Choose a file." }, {
                pattern: SAFE_SRC,
                patternMessage: "Use an uploaded file or a full https:// address.",
            });
        case "ref":
            return stringSchema({ max: 100, ...field, requiredMessage: "Choose one." });

        case "number": {
            let schema = z.number({ error: "Enter a number." });
            if (field.int) schema = schema.int("Use a whole number.");
            if (field.min != null) schema = schema.min(field.min, `Use ${field.min} or more.`);
            if (field.max != null) schema = schema.max(field.max, `Use ${field.max} or less.`);
            return z.preprocess(
                (value) => {
                    if (value === "" || value == null || (typeof value === "number" && Number.isNaN(value))) {
                        return field.required ? undefined : null;
                    }
                    return typeof value === "string" ? Number(value) : value;
                },
                field.required ? schema : schema.nullable(),
            );
        }

        case "toggle":
            return z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean());

        case "select": {
            const values = field.options.map((option) => option.value);
            return z.enum(values, { error: "Choose one of the options." });
        }

        case "date":
            return field.required
                ? z.preprocess((v) => v ?? "", z.string().refine(validDate, "Pick a date."))
                : z.preprocess(blankToNull, z.string().refine(validDate, "Pick a valid date.").nullable());

        case "image": {
            const shape = z.object({
                url: stringSchema({ max: 1000, required: true, requiredMessage: "Choose an image." }, {
                    pattern: SAFE_SRC,
                    patternMessage: "Use an uploaded image or a full https:// address.",
                }),
                alt: stringSchema({ max: 300 }),
                focal: z.preprocess(
                    (value) => (value ? value : "center"),
                    z.string().trim().max(40).regex(FOCAL, "Invalid focal point."),
                ),
            });
            if (field.required) return shape;
            /* An optional image with no url is stored as null, like the seed. */
            return z.preprocess((value) => (!value || !String(value.url ?? "").trim() ? null : value), shape.nullable());
        }

        case "lines":
        case "paragraphs":
            return stringListSchema(field, field.type);

        case "group": {
            const shape = formSchema(field.fields);
            if (!field.nullable) return shape;
            return z.preprocess((value) => (value == null || value._enabled === false ? null : value), shape.nullable());
        }

        case "list": {
            let schema = z.array(formSchema(field.fields)).max(field.max, `Keep this to ${field.max} items or fewer.`);
            if (field.min) schema = schema.min(field.min, `Add at least ${field.min}.`);
            if (field.unique) {
                /* e.g. desk keys: two rows with the same key would be ambiguous. */
                schema = schema.superRefine((items, ctx) => {
                    const seen = new Set();
                    items.forEach((item, index) => {
                        const value = String(item[field.unique] ?? "").toLowerCase();
                        if (value && seen.has(value)) {
                            ctx.addIssue({ code: "custom", path: [index, field.unique], message: "Already used by another row." });
                        }
                        seen.add(value);
                    });
                });
            }
            return z.preprocess((value) => (Array.isArray(value) ? value : []), schema);
        }

        default:
            throw new Error(`Unknown CMS field type: ${field.type}`);
    }
}

/** @param {Fields} fields */
export function formSchema(fields) {
    const shape = {};
    for (const [name, field] of Object.entries(fields)) {
        if (field.readOnly) continue;
        /* A flattened group is visual only: its fields live on the parent. */
        if (field.type === "group" && field.flatten) Object.assign(shape, formSchema(field.fields).shape);
        else shape[name] = fieldSchema(field);
    }
    return z.object(shape);
}

/* ---- Form values --------------------------------------------------------- */

const asDate = (value) => (value ? String(value).slice(0, 10) : "");

/** @param {Field} field */
function fieldToForm(field, value) {
    switch (field.type) {
        case "text":
        case "textarea":
        case "link":
        case "file":
        case "ref":
            return value == null ? "" : String(value);
        case "number":
            return value == null ? "" : value;
        case "toggle":
            return Boolean(value ?? field.default ?? false);
        case "select":
            return value ?? field.default ?? field.options[0]?.value ?? "";
        case "date":
            return asDate(value);
        case "image":
            return { url: value?.url ?? "", alt: value?.alt ?? "", focal: value?.focal || "center" };
        case "lines":
            return (value ?? []).join("\n");
        case "paragraphs":
            return (value ?? []).join("\n\n");
        case "group":
            return field.nullable
                ? { _enabled: value != null, ...toForm(field.fields, value ?? {}) }
                : toForm(field.fields, value ?? {});
        case "list":
            return (Array.isArray(value) ? value : []).map((item) => toForm(field.fields, item ?? {}));
        default:
            return value;
    }
}

/**
 * Document → form values. Unknown keys (`_id`, timestamps) are dropped;
 * missing ones get an empty value so every input is controlled.
 * @param {Fields} fields
 * @param {object} [doc]
 */
export function toForm(fields, doc = {}) {
    const out = {};
    for (const [name, field] of Object.entries(fields)) {
        if (field.readOnly) continue;
        if (field.type === "group" && field.flatten) Object.assign(out, toForm(field.fields, doc));
        else out[name] = fieldToForm(field, doc?.[name]);
    }
    return out;
}

/** A blank list row. */
export const emptyItem = (fields) => toForm(fields, {});

/* ---- Errors -------------------------------------------------------------- */

/**
 * Zod issues → `{ "hero.slides.0.headline": message }`, first message per
 * path. react-hook-form's setError takes the same dotted names.
 */
export function nestedFieldErrors(error) {
    const out = {};
    for (const issue of error.issues) {
        const path = issue.path.join(".");
        if (path && !out[path]) out[path] = issue.message;
    }
    return out;
}

/**
 * True when a dotted error path ("hero.slides.0.headline") names an input
 * the form actually renders. Errors on anything else (an `_id`, a field from
 * another settings section) would be invisible, so the action reports them
 * as a form-level message instead.
 * @param {Fields} fields
 * @param {string} path
 */
export function isFormPath(fields, path) {
    let level = fields;
    const parts = path.split(".");
    for (let i = 0; i < parts.length; i += 1) {
        let field = level?.[parts[i]];
        if (!field) {
            /* Flattened groups put their children on this level. */
            const flat = Object.values(level ?? {}).find((f) => f.type === "group" && f.flatten && f.fields[parts[i]]);
            field = flat?.fields[parts[i]];
        }
        if (!field || field.readOnly) return false;
        const rest = parts.length - i - 1;
        if (field.type === "list") {
            if (rest === 0) return true;
            if (!/^\d+$/.test(parts[i + 1])) return false;
            if (rest === 1) return true;
            level = field.fields;
            i += 1;
        } else if (field.type === "group") {
            if (rest === 0) return true;
            level = field.fields;
        } else if (field.type === "image") {
            return rest === 0 || (rest === 1 && ["url", "alt", "focal"].includes(parts[i + 1]));
        } else {
            return rest === 0;
        }
    }
    return false;
}

/* ---- Shared groups ------------------------------------------------------- */

/** Section header used across every page: eyebrow + title + optional intro. */
export const heading = (label = "Section heading", { intro = true, description } = {}) =>
    group(
        label,
        {
            eyebrow: text("Eyebrow", { max: 120, span: "half", hint: "Small gold label above the title." }),
            title: text("Title", { max: 300, span: "full" }),
            ...(intro ? { intro: textarea("Intro", { max: 2000, rows: 3 }) } : {}),
        },
        { description },
    );

export const cta = (label = "Button") =>
    group(label, {
        label: text("Label", { max: 80, span: "half" }),
        path: link("Link", { span: "half", placeholder: "/contact" }),
    });

/** Per-item search override (business, article). Empty fields fall back. */
export const seoOverride = () =>
    group(
        "Search & social",
        {
            title: text("SEO title", { max: 70, counter: [30, 60], hint: "Leave empty to use the name. The site name is added after it." }),
            description: textarea("Meta description", { max: 170, rows: 2, counter: [70, 160], hint: "Leave empty to use the summary." }),
            ogImage: file("Social share image", { accept: "image", max: 1000, hint: "1200×630 works best. Empty → the cover image." }),
            noindex: toggle("Hide from search engines", { hint: "Adds noindex. The page stays reachable by link." }),
        },
        { description: "How this page appears in Google and when shared on social media.", collapsible: true },
    );

export const metric = (unitHint = "Gold suffix such as + or %.") => ({
    label: text("Label", { max: 120, required: true, span: "half" }),
    value: text("Value", { max: 40, required: true, span: "third", hint: "Shown as typed, e.g. $250M or 1,500." }),
    unit: text("Unit", { max: 20, span: "third", hint: unitHint }),
    detail: textarea("Detail", { max: 500, rows: 2 }),
});

export const point = (titleMax = 200) => ({
    title: text("Title", { max: titleMax, required: true }),
    detail: textarea("Detail", { max: 2000, rows: 3 }),
});
