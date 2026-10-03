import { SAFE_HREF } from "../patterns.js";
import { email, file, group, key, lines, link, list, select, text, textarea, toggle, number } from "./fields.js";

/**
 * Site settings (server/models/SiteSettings.js) and route SEO
 * (server/models/SeoSetting.js).
 * ---------------------------------------------------------------------------
 * The settings singleton is edited in independent sections, each its own
 * form and save, so changing the footer can't clobber a navigation edit made
 * in another tab. `inquiryTypes` is super_admin only: it decides where leads
 * are emailed.
 */

const navLink = (extra = {}) => ({
    label: text("Label", { max: 120, required: true, span: "half" }),
    path: link("Link", { required: true, span: "half" }),
    ...extra,
});

export const SITE_SECTIONS = {
    brand: {
        key: "brand",
        label: "Brand",
        description: "Name, logo and the line under the footer wordmark.",
        fields: {
            name: text("Brand name", { max: 80, required: true, span: "half" }),
            legalName: text("Legal name", { max: 120, required: true, span: "half", hint: "Used in the copyright line and map captions." }),
            logo: file("Logo", { accept: "image", hint: "PNG with transparency. Also used as the browser icon." }),
            footerDescription: textarea("Footer description", { max: 400, rows: 2 }),
        },
    },

    navigation: {
        key: "navigation",
        label: "Navigation",
        description: "Top menu, the Inquire button and the businesses dropdown.",
        fields: {
            main: list(
                "Menu items",
                navLink({
                    label: text("Label", { max: 60, required: true, span: "half" }),
                    showBusinessesMenu: toggle("Show the businesses dropdown under this item", { hint: "Lists every published business." }),
                }),
                { summary: ["label", "path"], itemLabel: "Item", max: 8, min: 1 },
            ),
            cta: group("Header button", {
                label: text("Label", { max: 40, span: "half" }),
                path: link("Link", { span: "half" }),
            }),
            businessesMenu: group("Businesses dropdown", {
                eyebrow: text("Eyebrow", { max: 60, span: "third" }),
                viewAllLabel: text("“View all” link", { max: 60, span: "third" }),
                mobileViewAllLabel: text("“View all” on mobile", { max: 40, span: "third" }),
            }),
        },
    },

    footer: {
        key: "footer",
        label: "Footer",
        description: "Entity links, link columns, legal links, head office block and status line.",
        fields: {
            entities: group("Group entities column", {
                title: text("Column title", { max: 60, span: "half" }),
                links: list(
                    "Entities",
                    {
                        label: text("Name", { max: 120, required: true, span: "half" }),
                        path: link("Link", { required: true, span: "half" }),
                        tagline: text("Tagline", { max: 160 }),
                    },
                    { summary: "label", itemLabel: "Entity", max: 8 },
                ),
            }),
            columns: list(
                "Link columns",
                {
                    title: text("Column title", { max: 60, required: true }),
                    links: list("Links", navLink(), { summary: "label", itemLabel: "Link", max: 10 }),
                },
                { summary: "title", itemLabel: "Column", max: 4 },
            ),
            legal: list("Legal links", navLink(), { summary: "label", itemLabel: "Link", max: 6 }),
            headOfficeTitle: text("Head office heading", { max: 60, hint: "The address comes from the office marked as head office." }),
            cta: group("Footer button", {
                label: text("Label", { max: 60, span: "half" }),
                path: link("Link", { span: "half" }),
            }),
            copyright: text("Copyright line", { max: 160, hint: "Printed after “© {current year} ”." }),
            status: group("Status line", {
                isVisible: toggle("Show the status line"),
                label: text("Label", { max: 60, span: "third" }),
                state: text("State", { max: 40, span: "third" }),
                locale: text("Locale", { max: 60, span: "third" }),
            }),
        },
    },

    inquiryTypes: {
        key: "inquiryTypes",
        label: "Inquiry desks",
        description: "The contact form's inquiry types and the mailbox each one is delivered to.",
        superOnly: true,
        /* The form edits the top-level `inquiryTypes` array, not a nested object. */
        root: true,
        fields: {
            inquiryTypes: list(
                "Desks",
                {
                    label: text("Label", { max: 120, required: true, span: "half" }),
                    key: key("Key", { span: "half", hint: "Used in /contact?type=<key>. Changing it breaks those links." }),
                    routeTo: email("Deliver to", {
                        hint: "Never shown on the site. Empty → CONTACT_FALLBACK_INBOX.",
                    }),
                },
                { summary: ["label", "routeTo"], itemLabel: "Desk", max: 10, min: 1, unique: "key" },
            ),
        },
    },

    seo: {
        key: "seo",
        label: "Site-wide SEO",
        description: "Defaults every page falls back to, verification codes and social profiles.",
        fields: {
            siteName: text("Site name", { max: 80, span: "half", hint: "og:site_name and the browser app name." }),
            titleTemplate: text("Title template", {
                max: 80,
                span: "half",
                pattern: /%s/,
                patternMessage: "Must contain %s where the page title goes.",
                hint: "%s is replaced by the page title, e.g. “%s | Warrick Group”.",
            }),
            defaultTitle: text("Default title", { max: 70, counter: [30, 60] }),
            defaultDescription: textarea("Default description", { max: 170, rows: 2, counter: [70, 160] }),
            defaultOgImage: file("Default social image", { accept: "image", hint: "1200×630. Used when a page has none of its own." }),
            twitterHandle: text("X / Twitter handle", {
                max: 30,
                span: "third",
                pattern: /^(@\w{1,15})?$/,
                patternMessage: "Like @warrickgroup.",
            }),
            locale: text("Locale", { max: 10, span: "third", placeholder: "en_GB", pattern: /^[a-z]{2}(_[A-Z]{2})?$/, patternMessage: "Like en_GB." }),
            googleVerification: text("Google Search Console code", { max: 100, span: "half", mono: true, hint: "The content value of the google-site-verification tag." }),
            bingVerification: text("Bing Webmaster code", { max: 100, span: "half", mono: true }),
            sameAs: lines("Social profiles", {
                max: 10,
                itemMax: 500,
                itemPattern: SAFE_HREF,
                itemPatternMessage: "use a full https:// address.",
                hint: "One full URL per line (LinkedIn, X…). Used in structured data.",
            }),
        },
    },
};

export const SITE_SECTION_KEYS = Object.keys(SITE_SECTIONS);

/** One SeoSetting record. key/path/label are fixed by the code. */
export const ROUTE_SEO_FIELDS = {
    title: text("SEO title", { max: 70, counter: [30, 60], hint: "The site name is added after it (except on Home)." }),
    description: textarea("Meta description", { max: 170, rows: 3, counter: [70, 160] }),
    keywords: lines("Keywords", { max: 15, itemMax: 60, rows: 3, hint: "One per line. Search engines mostly ignore these; keep them few." }),
    ogImage: file("Social share image", { accept: "image", hint: "1200×630. Empty → the site default." }),
    noindex: toggle("Hide from search engines", { hint: "Adds noindex and leaves the page out of the sitemap." }),
    sitemap: group("Sitemap", {
        include: toggle("Include in sitemap.xml"),
        changeFrequency: select("Change frequency", ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((value) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
        })), { span: "half" }),
        priority: number("Priority", { int: false, min: 0, max: 1, required: true, span: "half", step: 0.1, hint: "0.0 – 1.0" }),
    }),
};
