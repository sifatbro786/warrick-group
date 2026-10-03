import {
    date,
    email,
    file,
    group,
    image,
    lines,
    link,
    list,
    metric,
    number,
    paragraphs,
    phone,
    point,
    ref,
    select,
    seoOverride,
    slug,
    text,
    textarea,
    toggle,
    year,
} from "./fields.js";

/**
 * Editors for the record collections.
 * ---------------------------------------------------------------------------
 * `order` and the publish flag are not form fields: the list screen reorders
 * and publishes with one click, and the form keeps whatever they are.
 *
 * kind        URL segment under /admin and the registry key
 * list        what the index table shows
 * publish     { field, on, off } — the visibility switch, or null
 * orderable   rows can be moved up/down (writes `order`)
 * view        public URL of a record, for "View on site"
 */

const PUBLISHED = { field: "isPublished", on: true, off: false, onLabel: "Published", offLabel: "Hidden" };

export const COLLECTION_SPECS = {
    businesses: {
        kind: "businesses",
        label: "Businesses",
        singular: "business",
        entity: "Business",
        description: "Operating companies. Each has a page under /businesses and appears in the navigation menu.",
        publish: PUBLISHED,
        orderable: true,
        list: { title: "name", subtitle: "sector", image: "coverImage", meta: ["slug"] },
        view: (doc) => `/businesses/${doc.slug}`,
        fields: {
            name: text("Name", { max: 120, required: true, span: "half" }),
            slug: slug("URL slug", {
                span: "half",
                slugFrom: "name",
                hint: "The page address: /businesses/<slug>. Changing it breaks links to the old address.",
            }),
            sector: text("Sector", { max: 160, required: true, span: "half" }),
            descriptor: text("Menu line", { max: 160, span: "half", hint: "Short line under the name in the navigation menu." }),
            tagline: text("Tagline", { max: 300 }),
            summary: textarea("Summary", { max: 1000, rows: 3, hint: "Shown on the businesses index and used as the meta description." }),
            coverImage: image("Cover image", { required: true }),
            facts: group("Company facts", {
                established: year("Established"),
                headquarters: text("Headquarters", { max: 160, span: "third" }),
                headcount: text("Headcount", { max: 40, span: "third", placeholder: "500+" }),
                type: select("Type", [
                    { value: "operating", label: "Operating company" },
                    { value: "parent", label: "Parent / holding" },
                ], { span: "half" }),
                ownership: text("Ownership", { max: 160, span: "half" }),
            }, { flatten: true }),
            website: group("Website", {
                url: link("Address", { required: true, span: "half", placeholder: "https://…" }),
                display: text("Displayed as", { max: 120, required: true, span: "half", placeholder: "clara.warrickgroup.com" }),
                status: select("Status", [
                    { value: "live", label: "Live — link to it" },
                    { value: "pending", label: "Launching soon — text only" },
                ], { span: "half" }),
            }, { nullable: true, description: "Off: the page shows no website band." }),
            detail: group("Company page", {
                lead: textarea("Lead", { max: 2000, rows: 3 }),
                narrative: paragraphs("Narrative", { itemMax: 3000, max: 20, hint: "Separate paragraphs with an empty line." }),
                metrics: list("Figures", metric("Optional suffix such as %, d or +."), { summary: ["label", "value"], itemLabel: "Figure", max: 8 }),
                capabilities: list("Capabilities", point(), { summary: "title", itemLabel: "Capability", max: 10 }),
                operations: group("Operations band", {
                    eyebrow: text("Eyebrow", { max: 120, span: "half" }),
                    title: text("Title", { max: 300 }),
                    intro: textarea("Intro", { max: 2000, rows: 3 }),
                    steps: list("Steps", point(), { summary: "title", itemLabel: "Step", max: 10 }),
                }, { nullable: true, description: "Off: the page skips this band." }),
            }),
            seo: seoOverride(),
        },
    },

    articles: {
        kind: "articles",
        label: "Newsroom",
        singular: "article",
        entity: "Article",
        description: "Press releases and insights. Published articles appear on /news and the home page.",
        publish: { field: "status", on: "published", off: "draft", onLabel: "Published", offLabel: "Draft" },
        orderable: false,
        list: { title: "title", subtitle: "summary", image: "coverImage", meta: ["publishedAt", "category"] },
        view: (doc) => `/news/${doc.slug}`,
        fields: {
            title: text("Headline", { max: 300, required: true }),
            slug: slug("URL slug", { span: "half", slugFrom: "title", hint: "The address: /news/<slug>." }),
            category: ref("Category", "categories", { required: true, span: "half" }),
            publishedAt: date("Publication date", { required: true, span: "third" }),
            readTime: number("Read time (min)", { min: 1, max: 120, required: true, span: "third" }),
            status: select("Status", [
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft — not on the site" },
            ], { span: "third" }),
            summary: textarea("Summary", { max: 600, rows: 3, hint: "Shown on cards and as the meta description." }),
            content: paragraphs("Body", { itemMax: 5000, max: 80, rows: 14, hint: "Plain text. Separate paragraphs with an empty line." }),
            coverImage: image("Cover image", { required: true }),
            seo: seoOverride(),
        },
    },

    categories: {
        kind: "categories",
        label: "News categories",
        singular: "category",
        entity: "NewsCategory",
        description: "The filter tabs on /news. A category with articles can't be deleted.",
        publish: null,
        orderable: true,
        parent: { label: "Newsroom", href: "/admin/articles" },
        list: { title: "label", meta: ["key"] },
        fields: {
            label: text("Label", { max: 60, required: true, span: "half" }),
            key: slug("Key", {
                span: "half",
                slugFrom: "label",
                reserved: ["all"],
                hint: "Internal identifier for the filter tab. “all” is reserved.",
            }),
        },
    },

    leaders: {
        kind: "leaders",
        label: "Leadership",
        singular: "person",
        entity: "Leader",
        description: "Principals, executives and board members on the About page, in this order.",
        publish: PUBLISHED,
        orderable: true,
        list: { title: "name", subtitle: "title", image: "photo", meta: ["type"] },
        view: () => "/about#leadership",
        fields: {
            name: text("Name", { max: 120, required: true, span: "half" }),
            key: slug("Key", { span: "half", slugFrom: "name", hint: "Internal identifier." }),
            title: text("Title", { max: 160, required: true }),
            type: select("Group", [
                { value: "executive", label: "Executive leadership" },
                { value: "board", label: "Board (non-executive)" },
            ], { span: "half" }),
            isPrincipal: toggle("Principal", { span: "half", hint: "Shown in the Office of the Chairman block with a portrait and quote." }),
            photo: image("Portrait", { hint: "Optional for board members." }),
            bio: textarea("Biography", { max: 1500, rows: 4 }),
            quote: textarea("Quote", { max: 600, rows: 2, hint: "Principals only." }),
        },
    },

    ventures: {
        kind: "ventures",
        label: "Ventures",
        singular: "programme",
        entity: "Venture",
        description: "Research and venture programmes on the Innovation page.",
        publish: PUBLISHED,
        orderable: true,
        list: { title: "name", subtitle: "sector", image: "coverImage", meta: ["stage"] },
        view: () => "/innovation",
        fields: {
            name: text("Name", { max: 160, required: true, span: "half" }),
            slug: slug("Key", { span: "half", slugFrom: "name" }),
            stage: select("Stage", [
                { value: "research", label: "Research" },
                { value: "pilot", label: "Pilot" },
                { value: "scaling", label: "Scaling" },
            ], { span: "third" }),
            sector: text("Sector", { max: 160, span: "third" }),
            established: year("Established"),
            location: text("Location", { max: 160, span: "half" }),
            leadEntity: text("Lead entity", { max: 120, span: "half" }),
            summary: textarea("Summary", { max: 800, rows: 3 }),
            coverImage: image("Cover image", { required: true }),
            detail: group("Programme detail", {
                overview: paragraphs("Overview", { itemMax: 3000, max: 12, hint: "Separate paragraphs with an empty line." }),
                milestones: list(
                    "Milestones",
                    {
                        label: text("Label", { max: 120, required: true, span: "half" }),
                        value: text("Value", { max: 40, required: true, span: "half" }),
                    },
                    { summary: ["label", "value"], itemLabel: "Milestone", max: 8 },
                ),
                partners: lines("Partners", { itemMax: 200, max: 12, hint: "One per line." }),
            }, { description: "Shown in the dialog when a programme is opened." }),
        },
    },

    reports: {
        kind: "reports",
        label: "Reports",
        singular: "report",
        entity: "Report",
        description: "Downloads in the Sustainability page's disclosure section.",
        publish: PUBLISHED,
        orderable: true,
        list: { title: "title", subtitle: "period", meta: ["category", "fileUrl"] },
        view: () => "/sustainability#reports",
        fields: {
            title: text("Title", { max: 200, required: true }),
            category: text("Category", { max: 60, span: "third", placeholder: "Climate" }),
            period: text("Period", { max: 60, span: "third", placeholder: "FY2025" }),
            publishedAt: date("Published", { required: true, span: "third" }),
            fileUrl: file("PDF", { required: true, accept: "document", fillSize: "fileSize" }),
            format: text("Format", { max: 10, span: "third" }),
            fileSize: text("File size", { max: 20, span: "third", placeholder: "2.4 MB" }),
            pages: number("Pages", { min: 0, max: 5000, span: "third" }),
        },
        defaults: { format: "PDF" },
    },

    offices: {
        kind: "offices",
        label: "Offices",
        singular: "office",
        entity: "Office",
        description: "Contact page, world map and the footer head office. One office is the head office.",
        publish: PUBLISHED,
        orderable: true,
        list: { title: "city", subtitle: "role", meta: ["isHeadquarters"] },
        view: () => "/contact",
        fields: {
            city: text("City", { max: 80, required: true, span: "half" }),
            key: slug("Key", { span: "half", slugFrom: "city", hint: "Internal identifier, used by the contact page map." }),
            role: text("Role", { max: 120, span: "half", placeholder: "Middle East Hub" }),
            isHeadquarters: toggle("Head office", { span: "half", hint: "Turning this on moves the head office here." }),
            address: lines("Address", { required: true, max: 6, itemMax: 160, rows: 4, hint: "One line per row, 1–6 rows." }),
            email: email("Email", { span: "half" }),
            phone: phone("Phone (dialled)", { span: "half" }),
            phoneDisplay: text("Phone (as displayed)", { max: 30, span: "half", placeholder: "+44 20 7946 0112" }),
            coordinates: group("Map position", {
                lat: number("Latitude", { int: false, min: -90, max: 90, required: true, span: "half", step: "any" }),
                lng: number("Longitude", { int: false, min: -180, max: 180, required: true, span: "half", step: "any" }),
            }, { description: "Right-click the spot in Google Maps to copy its coordinates." }),
        },
    },
};

export const COLLECTION_KINDS = Object.keys(COLLECTION_SPECS);

