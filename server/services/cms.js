import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db/connect";
import {
    Article,
    Business,
    ContactPage,
    Leader,
    NewsCategory,
    Office,
    PAGE_MODELS,
    Page,
    Report,
    SeoSetting,
    SiteSettings,
    User,
    Venture,
} from "@/server/models";
import { COLLECTION_SPECS, PAGE_SPECS, SITE_SECTIONS } from "@/server/validators/cms";
import { TAGS, toPlain } from "./_cache";

/**
 * Dashboard write layer for content.
 * ---------------------------------------------------------------------------
 * Callers (server/actions/cms.js) have already authorized and Zod-parsed the
 * input against the same spec the form used. This layer adds what Zod can't
 * know: uniqueness, references between records, optimistic concurrency and
 * the cache tags each write invalidates.
 *
 * Every write returns
 *   { ok: true, tags: string[], audit: { action, entity, entityId, summary }, id? }
 * or
 *   { ok: false, message } | { ok: false, errors: { "dotted.path": message } }
 * The action turns that into the form result and calls updateTag() per tag.
 */

const fail = (message) => ({ ok: false, message });
const fieldFail = (errors) => ({ ok: false, errors });

const CONFLICT = fail(
    "Someone else saved this since you opened it. Copy anything you need, then reload the page to see their version.",
);
const GONE = fail("This item no longer exists. It may have been deleted in another tab.");

const isObjectId = (value) => typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
const versionOf = (doc) => (doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null);

/* ---- Collections: server-side config next to the isomorphic spec --------- */

const COLLECTIONS = {
    businesses: { Model: Business, tags: [TAGS.businesses], unique: ["slug"], name: (d) => d.name },
    articles: {
        Model: Article,
        tags: [TAGS.news],
        unique: ["slug"],
        name: (d) => d.title,
        sort: { publishedAt: -1, _id: -1 },
        pageSize: 25,
        async prepare(data) {
            if (!isObjectId(data.category) || !(await NewsCategory.exists({ _id: data.category }))) {
                return fieldFail({ category: "Choose a category." });
            }
            return null;
        },
    },
    categories: {
        Model: NewsCategory,
        tags: [TAGS.news],
        unique: ["key"],
        name: (d) => d.label,
        async beforeDelete(doc) {
            const used = await Article.countDocuments({ category: doc._id });
            return used ? `${used} article${used === 1 ? "" : "s"} still use this category. Move them first.` : null;
        },
    },
    leaders: { Model: Leader, tags: [TAGS.leaders], unique: ["key"], name: (d) => d.name },
    ventures: { Model: Venture, tags: [TAGS.ventures], unique: ["slug"], name: (d) => d.name },
    reports: { Model: Report, tags: [TAGS.reports], unique: [], name: (d) => `${d.title} (${d.period || "—"})` },
    offices: {
        Model: Office,
        tags: [TAGS.offices],
        unique: ["key"],
        name: (d) => d.city,
        async beforeSave(doc, before) {
            /* One head office: the partial unique index would reject a second. */
            if (doc.isHeadquarters) {
                await Office.updateMany(
                    { _id: mongoose.trusted({ $ne: doc._id }), isHeadquarters: true },
                    { $set: { isHeadquarters: false } },
                );
            }
            /* Keep the contact page's map pointing at the renamed office. */
            if (before && before.key !== doc.key) {
                const { modifiedCount } = await ContactPage.updateOne(
                    { key: "contact", "locatedOffice.officeKey": before.key },
                    { $set: { "locatedOffice.officeKey": doc.key } },
                );
                if (modifiedCount) return [TAGS.page("contact")];
            }
            return [];
        },
        async beforeDelete(doc) {
            if (doc.isHeadquarters) return "This is the head office. Make another office the head office first.";
            const mapped = await ContactPage.exists({ key: "contact", "locatedOffice.officeKey": doc.key });
            return mapped ? "The contact page map shows this office. Pick another office there first." : null;
        },
    },
};

export const collectionConfig = (kind) => (Object.hasOwn(COLLECTIONS, kind) ? COLLECTIONS[kind] : null);

/** Mongo duplicate key → field error; Mongoose validation → field errors. */
function mapWriteError(error, spec) {
    if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern ?? error.keyValue ?? {})[0] ?? "slug";
        return fieldFail({ [field]: `Already used by another ${spec?.singular ?? "item"}.` });
    }
    if (error?.name === "ValidationError") {
        const errors = {};
        for (const [path, err] of Object.entries(error.errors)) errors[path] = err.message;
        return fieldFail(errors);
    }
    throw error;
}

/* Sub-document _ids are regenerated by every overwrite; they are not content. */
const contentJson = (value) => JSON.stringify(value ?? null, (key, v) => (key === "_id" ? undefined : v));

/** Top-level labels whose content changed, for the audit summary. */
function changedSections(fields, before, after) {
    const labels = [];
    for (const [name, field] of Object.entries(fields)) {
        const keys = field.type === "group" && field.flatten ? Object.keys(field.fields) : [name];
        const a = contentJson(keys.map((k) => before?.[k] ?? null));
        const b = contentJson(keys.map((k) => after?.[k] ?? null));
        if (a !== b) labels.push(field.label.toLowerCase());
    }
    return labels;
}

const summarize = (verb, what, sections) =>
    `${verb} ${what}${sections?.length ? ` (${sections.slice(0, 5).join(", ")}${sections.length > 5 ? "…" : ""})` : ""}`.slice(0, 300);

/* ---- Collections: reads -------------------------------------------------- */

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Rows for the index screen: list columns only, never bodies.
 * @param {string} kind
 * @param {{ q?: string, page?: number }} [query]
 */
export async function listItems(kind, { q, page = 1 } = {}) {
    const cfg = collectionConfig(kind);
    const spec = COLLECTION_SPECS[kind];
    await connectDB();

    const { title, subtitle, image, meta = [] } = spec.list;
    const projection = { order: 1, updatedAt: 1, slug: 1, key: 1, [title]: 1 };
    for (const f of [subtitle, image, ...meta, spec.publish?.field]) if (f) projection[f] = 1;

    const filter = {};
    if (q) filter[title] = mongoose.trusted({ $regex: escapeRegex(q), $options: "i" });

    const size = cfg.pageSize ?? 500;
    const [rows, total] = await Promise.all([
        cfg.Model.find(filter, projection)
            .sort(cfg.sort ?? { order: 1, _id: 1 })
            .skip((page - 1) * size)
            .limit(size)
            .lean(),
        cfg.Model.countDocuments(filter),
    ]);

    let out = rows;
    if (kind === "articles") {
        const categories = await NewsCategory.find({}, { label: 1 }).lean();
        const labels = new Map(categories.map((c) => [String(c._id), c.label]));
        out = rows.map((row) => ({ ...row, category: labels.get(String(row.category)) ?? "—" }));
    }
    return { items: toPlain(out), total, pages: Math.max(1, Math.ceil(total / size)), pageSize: size };
}

export async function getItem(kind, id) {
    const cfg = collectionConfig(kind);
    if (!cfg || !isObjectId(id)) return null;
    await connectDB();
    return toPlain(await cfg.Model.findById(id).lean());
}

/** Options for `ref` fields, keyed by the field's `source`. */
export async function getRefOptions(sources = []) {
    await connectDB();
    const out = {};
    if (sources.includes("categories")) {
        const rows = await NewsCategory.find({}, { label: 1 }).sort({ order: 1 }).lean();
        out.categories = rows.map((r) => ({ value: String(r._id), label: r.label }));
    }
    if (sources.includes("offices")) {
        const rows = await Office.find({}, { key: 1, city: 1, role: 1 }).sort({ order: 1 }).lean();
        out.offices = rows.map((r) => ({ value: r.key, label: r.role ? `${r.city} — ${r.role}` : r.city }));
    }
    return out;
}

/** Every `ref` source used by a field tree. */
export function refSources(fields, out = new Set()) {
    for (const field of Object.values(fields)) {
        if (field.type === "ref") out.add(field.source);
        if (field.fields) refSources(field.fields, out);
    }
    return [...out];
}

/* ---- Collections: writes ------------------------------------------------- */

/**
 * Create (id = null) or update a record.
 * @param {{ id: string }} actor
 * @param {string} kind
 * @param {string|null} id
 * @param {object} data      parsed by the spec's formSchema
 * @param {{ version?: string|null, published?: boolean }} options
 */
export async function saveItem(actor, kind, id, data, { version = null, published } = {}) {
    const cfg = collectionConfig(kind);
    const spec = COLLECTION_SPECS[kind];
    await connectDB();

    const prepared = await cfg.prepare?.(data);
    if (prepared) return prepared;

    const publish = spec.publish;
    const publishOwnedByList = publish && !(publish.field in spec.fields);

    let doc;
    let before = null;
    if (id) {
        if (!isObjectId(id)) return GONE;
        doc = await cfg.Model.findById(id);
        if (!doc) return GONE;
        if (version && versionOf(doc) !== version) return CONFLICT;
        before = doc.toObject();
        const keep = { order: doc.order };
        if (publishOwnedByList) keep[publish.field] = typeof published === "boolean" ? (published ? publish.on : publish.off) : doc[publish.field];
        doc.overwrite({ ...data, ...keep });
    } else {
        const last = await cfg.Model.findOne({}, { order: 1 }).sort({ order: -1 }).lean();
        const extra = { order: (last?.order ?? -1) + 1 };
        if (publishOwnedByList) extra[publish.field] = published === false ? publish.off : publish.on;
        doc = new cfg.Model({ ...data, ...extra });
    }

    let extraTags = [];
    try {
        await doc.validate();
        /* Checked up front (the unique index is the backstop) so a clash is
           reported before beforeSave touches other records. */
        for (const field of cfg.unique) {
            const clash = await cfg.Model.exists({ [field]: doc[field], _id: mongoose.trusted({ $ne: doc._id }) });
            if (clash) return fieldFail({ [field]: `Already used by another ${spec.singular}.` });
        }
        extraTags = (await cfg.beforeSave?.(doc, before)) ?? [];
        await doc.save();
    } catch (error) {
        return mapWriteError(error, spec);
    }

    const name = cfg.name(doc);
    const sections = before ? changedSections(spec.fields, before, doc.toObject()) : null;
    return {
        ok: true,
        id: String(doc._id),
        tags: [...cfg.tags, ...extraTags],
        audit: {
            action: before ? "update" : "create",
            entity: spec.entity,
            entityId: doc._id,
            summary: summarize(before ? "Updated" : "Created", `${spec.singular} “${name}”`, sections),
        },
    };
}

export async function deleteItem(kind, id) {
    const cfg = collectionConfig(kind);
    const spec = COLLECTION_SPECS[kind];
    if (!isObjectId(id)) return GONE;
    await connectDB();

    const doc = await cfg.Model.findById(id).lean();
    if (!doc) return GONE;
    const blocked = await cfg.beforeDelete?.(doc);
    if (blocked) return fail(blocked);

    await cfg.Model.deleteOne({ _id: id });
    return {
        ok: true,
        tags: cfg.tags,
        audit: { action: "delete", entity: spec.entity, entityId: id, summary: `Deleted ${spec.singular} “${cfg.name(doc)}”` },
    };
}

export async function setItemPublished(kind, id, published) {
    const cfg = collectionConfig(kind);
    const spec = COLLECTION_SPECS[kind];
    if (!spec.publish || !isObjectId(id)) return GONE;
    await connectDB();

    const value = published ? spec.publish.on : spec.publish.off;
    const doc = await cfg.Model.findOneAndUpdate(
        { _id: id },
        { $set: { [spec.publish.field]: value } },
        { returnDocument: "after", lean: true },
    );
    if (!doc) return GONE;
    const label = published ? spec.publish.onLabel : spec.publish.offLabel;
    return {
        ok: true,
        tags: cfg.tags,
        audit: {
            action: published ? "publish" : "unpublish",
            entity: spec.entity,
            entityId: id,
            summary: `${published ? "Published" : `Set to ${label.toLowerCase()}:`} ${spec.singular} “${cfg.name(doc)}”`,
        },
    };
}

/** Persist a new order. `ids` must be exactly the collection's records. */
export async function reorderItems(kind, ids) {
    const cfg = collectionConfig(kind);
    const spec = COLLECTION_SPECS[kind];
    if (!spec.orderable) return fail("This list can't be reordered.");
    await connectDB();

    const total = await cfg.Model.countDocuments({});
    const unique = new Set(ids);
    if (unique.size !== ids.length || ids.length !== total) return fail("The list changed in another tab. Reload and try again.");
    const found = await cfg.Model.countDocuments({ _id: mongoose.trusted({ $in: ids }) });
    if (found !== total) return fail("The list changed in another tab. Reload and try again.");

    await cfg.Model.bulkWrite(
        ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } })),
    );
    return {
        ok: true,
        tags: cfg.tags,
        audit: { action: "reorder", entity: spec.entity, summary: `Reordered ${spec.label.toLowerCase()}` },
    };
}

/* ---- Pages --------------------------------------------------------------- */

/** Index rows: key, last update, who. */
export async function listPages() {
    await connectDB();
    const rows = await Page.find({}, { key: 1, updatedAt: 1, updatedBy: 1 }).lean();
    const userIds = rows.map((r) => r.updatedBy).filter(Boolean);
    const users = userIds.length ? await User.find({ _id: mongoose.trusted({ $in: userIds }) }, { name: 1 }).lean() : [];
    const names = new Map(users.map((u) => [String(u._id), u.name]));
    return Object.fromEntries(
        rows.map((r) => [r.key, { updatedAt: r.updatedAt, updatedBy: r.updatedBy ? names.get(String(r.updatedBy)) ?? null : null }]),
    );
}

export async function getPageForEdit(key) {
    if (!Object.hasOwn(PAGE_MODELS, key)) return null;
    await connectDB();
    return toPlain(await Page.findOne({ key }).lean());
}

export async function savePage(actor, key, data, { version = null } = {}) {
    const spec = PAGE_SPECS[key];
    await connectDB();

    if (key === "contact" && data.locatedOffice?.officeKey) {
        if (!(await Office.exists({ key: data.locatedOffice.officeKey }))) {
            return fieldFail({ "locatedOffice.officeKey": "That office no longer exists." });
        }
    }

    const doc = await PAGE_MODELS[key].findOne({ key });
    if (!doc) return fail('This page is missing from the database. Run "npm run seed".');
    if (version && versionOf(doc) !== version) return CONFLICT;

    const before = doc.toObject();
    doc.overwrite({ key, ...data, updatedBy: actor.id });
    try {
        await doc.save();
    } catch (error) {
        return mapWriteError(error);
    }

    return {
        ok: true,
        tags: [TAGS.page(key)],
        audit: {
            action: "update",
            entity: `Page:${key}`,
            entityId: doc._id,
            summary: summarize("Updated", `the ${spec.label} page`, changedSections(spec.fields, before, doc.toObject())),
        },
    };
}

/* ---- Site settings ------------------------------------------------------- */

/**
 * The settings document for the editor. `inquiryTypes` (with the server-only
 * `routeTo` mailboxes) is included only when asked for — the page asks only
 * for super admins.
 */
export async function getSiteForEdit({ includeRouting = false } = {}) {
    await connectDB();
    const projection = includeRouting ? {} : { inquiryTypes: 0 };
    return toPlain(await SiteSettings.findOne({ key: "site" }, projection).lean());
}

/**
 * Sections are saved independently and write only their own subtree, so two
 * people editing different sections never overwrite each other.
 */
export async function saveSiteSection(sectionKey, data) {
    const section = SITE_SECTIONS[sectionKey];
    await connectDB();
    const doc = await SiteSettings.findOne({ key: "site" });
    if (!doc) return fail('Site settings are missing. Run "npm run seed".');

    const before = section.root ? { inquiryTypes: doc.toObject().inquiryTypes } : doc.toObject()[section.key];
    if (section.root) {
        for (const [name, value] of Object.entries(data)) doc.set(name, value);
    } else {
        doc.set(section.key, data);
    }

    try {
        /* Validate only this section: a bad value elsewhere in the document
           (another section, legacy data) must not block saving this one. */
        await doc.save({ validateModifiedOnly: true });
    } catch (error) {
        /* Model paths are "brand.logo"; the section form knows them as "logo". */
        const mapped = mapWriteError(error);
        if (mapped.errors && !section.root) {
            mapped.errors = Object.fromEntries(
                Object.entries(mapped.errors).map(([path, message]) => [path.replace(`${section.key}.`, ""), message]),
            );
        }
        return mapped;
    }

    const after = section.root ? { inquiryTypes: doc.toObject().inquiryTypes } : doc.toObject()[section.key];
    return {
        ok: true,
        tags: [TAGS.site],
        audit: {
            action: "update",
            entity: "SiteSettings",
            entityId: doc._id,
            summary: summarize("Updated", `site settings: ${section.label.toLowerCase()}`, changedSections(section.fields, before, after)),
        },
    };
}

/* ---- Route SEO ----------------------------------------------------------- */

export async function listRouteSeo() {
    await connectDB();
    const rows = await SeoSetting.find({}).sort({ "sitemap.priority": -1, path: 1 }).lean();
    return toPlain(rows);
}

export async function saveRouteSeo(id, data, { version = null } = {}) {
    if (!isObjectId(id)) return GONE;
    await connectDB();
    const doc = await SeoSetting.findById(id);
    if (!doc) return GONE;
    if (version && versionOf(doc) !== version) return CONFLICT;

    /* key / path / label are fixed by the code; everything else is editable. */
    doc.overwrite({ key: doc.key, path: doc.path, label: doc.label, ...data });
    try {
        await doc.save();
    } catch (error) {
        return mapWriteError(error);
    }
    return {
        ok: true,
        tags: [TAGS.seo],
        audit: { action: "update", entity: "SeoSetting", entityId: id, summary: `Updated SEO for ${doc.label} (${doc.path})` },
    };
}
