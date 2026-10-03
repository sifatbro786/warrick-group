/**
 * CMS registry — every editor the dashboard has, by kind.
 * Isomorphic: the admin pages, the client form and the Server Actions all
 * look editors up here, so they can never disagree about a field.
 */
export { PAGE_SPECS, PAGE_SPEC_KEYS } from "./pages.js";
export { COLLECTION_SPECS, COLLECTION_KINDS } from "./collections.js";
export { SITE_SECTIONS, SITE_SECTION_KEYS, ROUTE_SEO_FIELDS } from "./site.js";
export { emptyItem, formSchema, isFormPath, nestedFieldErrors, toForm } from "./fields.js";
