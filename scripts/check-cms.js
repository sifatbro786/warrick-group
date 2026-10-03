/**
 * CMS spec check — no database needed.
 * ===========================================================================
 *   node scripts/check-cms.js
 *
 * For every seeded document (7 pages, every collection record, each site
 * settings section, each route SEO record):
 *   1. toForm(spec, doc) → formSchema.parse  (what the browser submits)
 *   2. parse again                            (what the Server Action re-checks)
 *   3. the result validates against the Mongoose model
 *   4. nothing the seed had is lost or changed  (deep compare)
 * and every path in the Mongoose schemas is covered by a field.
 *
 * Run it after changing a model or a spec. Exit code 1 on any problem.
 */
import mongoose from "mongoose";
import {
    Article,
    Business,
    Leader,
    NewsCategory,
    Office,
    PAGE_MODELS,
    Report,
    SeoSetting,
    SiteSettings,
    Venture,
} from "../server/models/index.js";
import {
    COLLECTION_SPECS,
    formSchema,
    PAGE_SPECS,
    ROUTE_SEO_FIELDS,
    SITE_SECTIONS,
    toForm,
} from "../server/validators/cms/index.js";

import businesses from "./seed/data/businesses.js";
import leaders from "./seed/data/leaders.js";
import news from "./seed/data/news.js";
import offices from "./seed/data/offices.js";
import pages from "./seed/data/pages.js";
import reports from "./seed/data/reports.js";
import seo from "./seed/data/seo.js";
import site from "./seed/data/site.js";
import ventures from "./seed/data/ventures.js";

const problems = [];
let checked = 0;

/* ---- Normalisation: "" / null / false / [] / {} all mean "nothing here" ---
   (every boolean in the models defaults to false). */

function normalize(value) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "string") {
        return /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z)?$/.test(value) ? value.slice(0, 10) : value;
    }
    if (Array.isArray(value)) {
        const out = value.map(normalize);
        return out.length ? out : undefined;
    }
    if (value && typeof value === "object") {
        if (value instanceof mongoose.Types.ObjectId) return String(value);
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            if (k === "_id") continue;
            const n = normalize(v);
            if (n !== undefined && n !== "" && n !== null && n !== false) out[k] = n;
        }
        return Object.keys(out).length ? out : undefined;
    }
    return value;
}

function diff(a, b, path = "") {
    const out = [];
    if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
        out.push(`${path || "(root)"}: ${JSON.stringify(a)?.slice(0, 80)} ≠ ${JSON.stringify(b)?.slice(0, 80)}`);
    } else if (a && typeof a === "object") {
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out.push(...diff(a[k], b[k], path ? `${path}.${k}` : k));
    } else if (a !== b) {
        out.push(`${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
    }
    return out;
}

async function roundTrip(label, fields, source, Model, { extra = {}, ignore = [] } = {}) {
    checked += 1;
    const schema = formSchema(fields);
    const first = schema.safeParse(toForm(fields, source));
    if (!first.success) {
        problems.push(`${label}: form rejects seed data → ${first.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        return;
    }
    const second = schema.safeParse(first.data);
    if (!second.success) {
        problems.push(`${label}: server re-parse fails → ${second.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        return;
    }
    if (diff(normalize(first.data), normalize(second.data)).length) problems.push(`${label}: parse is not idempotent`);

    if (Model) {
        const doc = new Model({ ...extra, ...second.data });
        const error = await doc.validate().then(() => null, (e) => e);
        if (error) {
            problems.push(`${label}: Mongoose rejects → ${Object.entries(error.errors).map(([p, e]) => `${p}: ${e.message}`).join("; ")}`);
        }
    }

    const expected = normalize(omit(source, ignore)) ?? {};
    const actual = normalize(second.data) ?? {};
    for (const line of diff(expected, actual)) problems.push(`${label}: ${line}`);
}

const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/* ---- Coverage: every schema path has a field ------------------------------ */

const SYSTEM = new Set(["_id", "__v", "createdAt", "updatedAt", "updatedBy", "key", "order"]);

function specPaths(fields, prefix = "") {
    const out = new Set();
    for (const [name, field] of Object.entries(fields)) {
        if (field.type === "group" && field.flatten) {
            for (const p of specPaths(field.fields, prefix)) out.add(p);
            continue;
        }
        const path = prefix + name;
        out.add(path);
        if (field.type === "group" || field.type === "list") {
            for (const p of specPaths(field.fields, `${path}.`)) out.add(p);
        }
        if (field.type === "image") ["url", "alt", "focal"].forEach((k) => out.add(`${path}.${k}`));
    }
    return out;
}

function modelPaths(schema, prefix = "") {
    const out = [];
    schema.eachPath((path, type) => {
        const full = prefix + path;
        if (SYSTEM.has(path.split(".").pop()) && !prefix) return;
        if (path === "_id") return;
        out.push(full);
        if (type.schema) out.push(...modelPaths(type.schema, `${full}.`));
    });
    return out;
}

function coverage(label, fields, schema, { allow = [] } = {}) {
    const covered = specPaths(fields);
    for (const path of modelPaths(schema)) {
        if (covered.has(path) || allow.some((a) => path === a || path.startsWith(`${a}.`))) continue;
        /* Intermediate nested-object paths ("hero" when "hero.title" exists). */
        if ([...covered].some((c) => c.startsWith(`${path}.`))) continue;
        problems.push(`${label}: model path "${path}" has no editor field`);
    }
}

/* ---- Pages ---------------------------------------------------------------- */

/* Heading intros the public page never renders are deliberately not offered. */
const UNRENDERED = {
    home: ["brands.heading.intro", "commitment.heading.intro", "news.heading.intro", "inquiry.heading.intro"],
    about: ["principals.heading.intro", "executives.heading.intro", "board.heading.title", "board.heading.intro"],
    businesses: ["outro.heading.intro", "detail.capabilities.intro", "detail.elsewhere.intro"],
    sustainability: ["esg.heading.intro"],
    innovation: ["ventures.heading.intro", "capitalNote.heading.intro"],
    contact: ["map.heading.intro"],
};

for (const [key, spec] of Object.entries(PAGE_SPECS)) {
    await roundTrip(`page:${key}`, spec.fields, pages[key], PAGE_MODELS[key], { extra: { key } });
    coverage(`page:${key}`, spec.fields, PAGE_MODELS[key].schema, { allow: UNRENDERED[key] ?? [] });
}

/* ---- Collections ---------------------------------------------------------- */

const fakeId = () => new mongoose.Types.ObjectId().toString();
const categoryIds = Object.fromEntries(news.categories.map((c) => [c.key, fakeId()]));

const collections = {
    businesses: { Model: Business, rows: businesses },
    articles: { Model: Article, rows: news.articles.map((a) => ({ ...a, category: categoryIds[a.category] })) },
    categories: { Model: NewsCategory, rows: news.categories },
    leaders: { Model: Leader, rows: leaders },
    ventures: { Model: Venture, rows: ventures },
    reports: { Model: Report, rows: reports },
    offices: { Model: Office, rows: offices },
};

for (const [kind, { Model, rows }] of Object.entries(collections)) {
    const spec = COLLECTION_SPECS[kind];
    const publishField = spec.publish?.field;
    for (const row of rows) {
        /* The list screen owns order + publish; the form keeps them as they are. */
        const kept = { order: row.order ?? 0, ...(publishField ? { [publishField]: row[publishField] ?? spec.publish.on } : {}) };
        await roundTrip(`${kind}:${row.slug ?? row.key ?? row.title}`, spec.fields, row, Model, {
            extra: kept,
            ignore: ["order", publishField].filter((k) => k && !(k in spec.fields)),
        });
    }
    const skip = publishField && !(publishField in spec.fields) ? [publishField] : [];
    /* `key` is a real field for categories/leaders/offices; SYSTEM hides it. */
    coverage(`collection:${kind}`, spec.fields, Model.schema, { allow: skip });
    for (const must of ["key", "slug"]) {
        if (Model.schema.path(must) && !specPaths(spec.fields).has(must)) problems.push(`collection:${kind}: no field for "${must}"`);
    }
}

/* ---- Site settings -------------------------------------------------------- */

for (const section of Object.values(SITE_SECTIONS)) {
    const source = section.root ? { inquiryTypes: site.inquiryTypes } : site[section.key];
    await roundTrip(`site:${section.key}`, section.fields, source, null);
}
{
    /* Re-assemble the whole document from the section outputs and validate. */
    const assembled = { key: "site" };
    for (const section of Object.values(SITE_SECTIONS)) {
        const source = section.root ? { inquiryTypes: site.inquiryTypes } : site[section.key];
        const data = formSchema(section.fields).parse(toForm(section.fields, source));
        if (section.root) Object.assign(assembled, data);
        else assembled[section.key] = data;
    }
    const error = await new SiteSettings(assembled).validate().then(() => null, (e) => e);
    if (error) problems.push(`site: Mongoose rejects → ${Object.keys(error.errors).join(", ")}`);
    checked += 1;

    const allFields = {};
    for (const section of Object.values(SITE_SECTIONS)) {
        if (section.root) Object.assign(allFields, section.fields);
        else allFields[section.key] = { type: "group", fields: section.fields };
    }
    coverage("site", allFields, SiteSettings.schema);
}

for (const route of seo) {
    await roundTrip(`seo:${route.key}`, ROUTE_SEO_FIELDS, route, SeoSetting, {
        extra: { key: route.key, path: route.path, label: route.label },
        ignore: ["key", "path", "label"],
    });
}
coverage("seo", ROUTE_SEO_FIELDS, SeoSetting.schema, { allow: ["path", "label"] });

/* ---- Negative checks: the form refuses what the model refuses ------------- */

const mustFail = [
    ["link javascript:", COLLECTION_SPECS.businesses.fields.website.fields, { url: "javascript:alert(1)", display: "x", status: "live" }],
    ["link //host", PAGE_SPECS.home.fields.inquiry.fields, { channels: [{ label: "x", path: "//evil.com", detail: "" }] }],
    ["image data:", PAGE_SPECS.home.fields.commitment.fields, { image: { url: "data:image/png;base64,AAAA", alt: "", focal: "center" } }],
    ["slug spaces", COLLECTION_SPECS.businesses.fields, { ...businesses[0], slug: "Bad Slug" }],
    ["category all", COLLECTION_SPECS.categories.fields, { label: "All", key: "all" }],
    ["phone", COLLECTION_SPECS.offices.fields, { ...offices[0], phone: "020 7946" }],
    ["newline in title", COLLECTION_SPECS.reports.fields, { ...reports[0], title: "a\nb" }],
    ["duplicate desk", SITE_SECTIONS.inquiryTypes.fields, { inquiryTypes: [{ key: "a", label: "A" }, { key: "a", label: "B" }] }],
    ["template without %s", SITE_SECTIONS.seo.fields, { ...site.seo, titleTemplate: "Warrick" }],
];
for (const [label, fields, value] of mustFail) {
    checked += 1;
    if (formSchema(fields).safeParse(toForm(fields, value)).success) problems.push(`negative "${label}": accepted but should be rejected`);
}

if (problems.length) {
    console.error(`✗ ${problems.length} problem(s) in ${checked} checks:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exitCode = 1;
} else {
    console.log(`✓ CMS specs: ${checked} checks passed (round-trip, model validation, coverage, negatives).`);
}
