"use server";

import "server-only";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { authorize } from "@/server/auth/dal";
import { audit } from "@/server/services/audit";
import {
    deleteItem,
    reorderItems,
    saveItem,
    savePage,
    saveRouteSeo,
    saveSiteSection,
    setItemPublished,
} from "@/server/services/cms";
import {
    COLLECTION_KINDS,
    COLLECTION_SPECS,
    formSchema,
    isFormPath,
    nestedFieldErrors,
    PAGE_SPEC_KEYS,
    PAGE_SPECS,
    ROUTE_SEO_FIELDS,
    SITE_SECTION_KEYS,
    SITE_SECTIONS,
} from "@/server/validators/cms";
import { objectId } from "@/server/validators/_shared";

/**
 * Content actions.
 * ---------------------------------------------------------------------------
 * Any signed-in admin edits content; deleting records and changing where
 * inquiries are emailed are super_admin only (same rule as the inbox).
 * Every action: authorize → validate kind/id → parse input with the editor's
 * spec (the same Zod the form ran) → service → updateTag + audit + refresh.
 */

const kindSchema = z.enum(COLLECTION_KINDS);
const pageSchema = z.enum(PAGE_SPEC_KEYS);
const sectionSchema = z.enum(SITE_SECTION_KEYS);
const versionSchema = z.string().max(40).nullable().optional().catch(null);

const BAD_REQUEST = { status: "error", message: "That request wasn't valid. Reload the page and try again." };

/* Schemas are pure functions of the spec; build each once per process. */
const schemaCache = new Map();
function schemaFor(id, fields) {
    if (!schemaCache.has(id)) schemaCache.set(id, formSchema(fields));
    return schemaCache.get(id);
}

function parse(id, fields, input) {
    const parsed = schemaFor(id, fields).safeParse(input ?? {});
    return parsed.success
        ? { data: parsed.data }
        : { invalid: { status: "invalid", errors: nestedFieldErrors(parsed.error) } };
}

/**
 * Service result → form result. Field errors the form can't show (no input
 * for that path) become one readable form-level message instead of a save
 * that silently does nothing.
 */
async function finish(user, result, message, fields) {
    if (!result.ok) {
        if (!result.errors) return { status: "error", message: result.message };
        const shown = {};
        const hidden = [];
        for (const [path, text] of Object.entries(result.errors)) {
            if (fields && isFormPath(fields, path)) shown[path] = text;
            else hidden.push(`${path}: ${text}`);
        }
        if (hidden.length) {
            return {
                status: "error",
                message: `Couldn't save — stored data failed a check this form can't show (${hidden[0].slice(0, 160)}). Ask a developer to look at it.`,
            };
        }
        return { status: "invalid", errors: shown };
    }
    for (const tag of result.tags) updateTag(tag);
    await audit(user, result.audit);
    refresh();
    return { status: "success", message, ...(result.id ? { id: result.id } : {}) };
}

/* ---- Pages --------------------------------------------------------------- */

export async function savePageAction(key, input, version) {
    const { user } = await authorize();
    if (!pageSchema.safeParse(key).success) return BAD_REQUEST;

    const { data, invalid } = parse(`page:${key}`, PAGE_SPECS[key].fields, input);
    if (invalid) return invalid;

    const result = await savePage(user, key, data, { version: versionSchema.parse(version) });
    return finish(user, result, "Page saved. The site is updated.", PAGE_SPECS[key].fields);
}

/* ---- Collections --------------------------------------------------------- */

/**
 * @param {string} kind
 * @param {string|null} id         null creates
 * @param {object} input           form values
 * @param {{ version?: string|null, published?: boolean }} [options]
 */
export async function saveItemAction(kind, id, input, options = {}) {
    const { user } = await authorize();
    if (!kindSchema.safeParse(kind).success) return BAD_REQUEST;
    if (id !== null && !objectId.safeParse(id).success) return BAD_REQUEST;

    const spec = COLLECTION_SPECS[kind];
    const { data, invalid } = parse(`item:${kind}`, spec.fields, input);
    if (invalid) return invalid;

    const result = await saveItem(user, kind, id, data, {
        version: versionSchema.parse(options?.version),
        published: typeof options?.published === "boolean" ? options.published : undefined,
    });
    return finish(user, result, id ? "Saved. The site is updated." : `${capitalize(spec.singular)} created.`, spec.fields);
}

export async function deleteItemAction(kind, id) {
    const { user, denied } = await authorize({ superAdmin: true });
    if (denied) return denied;
    if (!kindSchema.safeParse(kind).success || !objectId.safeParse(id).success) return BAD_REQUEST;

    const result = await deleteItem(kind, id);
    return finish(user, result, "Deleted.");
}

export async function setPublishedAction(kind, id, published) {
    const { user } = await authorize();
    if (!kindSchema.safeParse(kind).success || !objectId.safeParse(id).success || typeof published !== "boolean") {
        return BAD_REQUEST;
    }
    const result = await setItemPublished(kind, id, published);
    const spec = COLLECTION_SPECS[kind];
    return finish(user, result, published ? `${spec.publish?.onLabel ?? "Published"}.` : `${spec.publish?.offLabel ?? "Hidden"}.`);
}

export async function reorderAction(kind, ids) {
    const { user } = await authorize();
    if (!kindSchema.safeParse(kind).success) return BAD_REQUEST;
    const parsed = z.array(objectId).max(500).safeParse(ids);
    if (!parsed.success) return BAD_REQUEST;

    const result = await reorderItems(kind, parsed.data);
    return finish(user, result, "Order saved.");
}

/* ---- Site settings & SEO ------------------------------------------------- */

export async function saveSiteSectionAction(sectionKey, input) {
    if (!sectionSchema.safeParse(sectionKey).success) {
        await authorize();
        return BAD_REQUEST;
    }
    const section = SITE_SECTIONS[sectionKey];
    const { user, denied } = await authorize({ superAdmin: Boolean(section.superOnly) });
    if (denied) return denied;

    const { data, invalid } = parse(`site:${sectionKey}`, section.fields, input);
    if (invalid) return invalid;

    const result = await saveSiteSection(sectionKey, data);
    return finish(user, result, `${section.label} saved.`, section.fields);
}

export async function saveRouteSeoAction(id, input, version) {
    const { user } = await authorize();
    if (!objectId.safeParse(id).success) return BAD_REQUEST;

    const { data, invalid } = parse("route-seo", ROUTE_SEO_FIELDS, input);
    if (invalid) return invalid;

    const result = await saveRouteSeo(id, data, { version: versionSchema.parse(version) });
    return finish(user, result, "SEO saved.", ROUTE_SEO_FIELDS);
}

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
