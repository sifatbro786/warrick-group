import {
    cta,
    group,
    heading,
    image,
    link,
    list,
    lines,
    metric,
    number,
    paragraphs,
    point,
    ref,
    select,
    text,
    textarea,
    date,
} from "./fields.js";

/**
 * Editors for the seven page documents (server/models/Page.js).
 * ---------------------------------------------------------------------------
 * Top-level keys are the sections of the page, in the order they appear on
 * the site. A heading's `intro` is only offered where the page renders it.
 * Records with their own collection (businesses, articles, leaders…) are
 * linked from `uses`, not edited here.
 */

const hero = (label = "Page hero") =>
    group(label, {
        eyebrow: text("Eyebrow", { max: 120, span: "half" }),
        title: text("Title", { max: 300, span: "full" }),
        lead: textarea("Lead paragraph", { max: 1500, rows: 3 }),
    }, { description: "The banner at the top of the page." });

const plainHeading = (label) => heading(label, { intro: false });

/** @type {Record<string, { key: string, label: string, path: string, description: string, uses?: Array<{ label: string, href: string }>, fields: object }>} */
export const PAGE_SPECS = {
    home: {
        key: "home",
        label: "Home",
        path: "/",
        description: "Hero carousel, figures, founder block, portfolio, partners, commitment, news and inquiry desks.",
        uses: [{ label: "Latest news comes from the Newsroom", href: "/admin/articles" }],
        fields: {
            hero: group("Hero carousel", {
                srHeading: text("Hidden page heading", {
                    max: 300,
                    hint: "Read by screen readers and search engines; not shown on screen.",
                }),
                slides: list(
                    "Slides",
                    {
                        name: text("Company name", { max: 120, required: true, span: "half" }),
                        sector: text("Sector", { max: 120, span: "half" }),
                        headline: text("Headline", { max: 200, required: true }),
                        body: textarea("Body", { max: 600, rows: 3 }),
                        ctaLabel: text("Button label", { max: 60, span: "half" }),
                        path: link("Button link", { span: "half" }),
                        image: image("Background image", { required: true, hint: "Full-bleed. 2560px wide works best." }),
                    },
                    { summary: ["name", "headline"], itemLabel: "Slide", max: 8, min: 1 },
                ),
            }, { description: "Full-screen slides with the entity strip underneath." }),

            stats: group("Figures", {
                heading: heading(),
                items: list("Figures", metric(), { summary: ["label", "value"], itemLabel: "Figure", max: 8 }),
            }),

            founder: group("Founder & vision", {
                eyebrow: text("Eyebrow", { max: 120, span: "half" }),
                title: text("Title", { max: 300 }),
                image: image("Portrait", { hint: "Optional. Portrait crop; set the focal point on the face." }),
                name: text("Name", { max: 120, span: "half" }),
                role: text("Role", { max: 160, span: "half" }),
                quote: textarea("Quote", { max: 600, rows: 3 }),
                paragraphs: paragraphs("Statement", { itemMax: 3000, max: 10, hint: "Separate paragraphs with an empty line." }),
                pillars: list("Pillars", point(), { summary: "title", itemLabel: "Pillar", max: 6 }),
                cta: cta(),
            }),

            portfolio: group("Portfolio", {
                heading: heading(),
                itemCtaLabel: text("Card button label", { max: 60, span: "half" }),
                items: list(
                    "Cards",
                    {
                        name: text("Name", { max: 120, required: true, span: "half" }),
                        sector: text("Sector", { max: 160, span: "half" }),
                        summary: textarea("Summary", { max: 800, rows: 3 }),
                        path: link("Link", { span: "half" }),
                        image: image("Image", { required: true }),
                    },
                    { summary: "name", itemLabel: "Card", max: 9 },
                ),
            }),

            brands: group("Entities & partners", {
                heading: plainHeading("Section heading"),
                items: list(
                    "Names",
                    {
                        name: text("Name", { max: 120, required: true, span: "half" }),
                        type: select("Type", [
                            { value: "entity", label: "Group entity" },
                            { value: "partner", label: "Partner" },
                        ], { span: "half", default: "partner" }),
                    },
                    { summary: "name", itemLabel: "Name", max: 24 },
                ),
            }),

            commitment: group("Commitment", {
                heading: plainHeading("Section heading"),
                image: image("Image", { hint: "Optional." }),
                values: list("Values", point(), { summary: "title", itemLabel: "Value", max: 6 }),
            }),

            news: group("Latest news", {
                heading: plainHeading("Section heading"),
                cta: cta(),
                limit: number("Articles shown", { min: 1, max: 9, required: true, span: "third", hint: "Newest published first." }),
            }, { description: "Articles themselves are edited in the Newsroom." }),

            inquiry: group("Corporate inquiries", {
                heading: plainHeading("Section heading"),
                statement: textarea("Statement", { max: 800, rows: 3 }),
                channels: list(
                    "Desks",
                    {
                        label: text("Label", { max: 120, required: true, span: "half" }),
                        path: link("Link", { required: true, span: "half", hint: "e.g. /contact?type=media preselects the desk." }),
                        detail: textarea("Detail", { max: 300, rows: 2 }),
                    },
                    { summary: "label", itemLabel: "Desk", max: 6 },
                ),
            }),
        },
    },

    about: {
        key: "about",
        label: "About",
        path: "/about",
        description: "Group story, values, leadership section headings and governance.",
        uses: [{ label: "People come from Leadership", href: "/admin/leaders" }],
        fields: {
            hero: group("Page hero", {
                eyebrow: text("Eyebrow", { max: 120, span: "half" }),
                title: text("Title", { max: 300 }),
                lead: textarea("Lead paragraph", { max: 1500, rows: 3 }),
                meta: list(
                    "Facts strip",
                    {
                        label: text("Label", { max: 60, required: true, span: "half" }),
                        value: text("Value", { max: 40, required: true, span: "half" }),
                    },
                    { summary: ["label", "value"], itemLabel: "Fact", max: 6 },
                ),
            }),
            story: group("Origin & mandate", {
                eyebrow: text("Eyebrow", { max: 120, span: "half" }),
                title: text("Title", { max: 300 }),
                history: paragraphs("History", { itemMax: 3000, max: 12, hint: "Separate paragraphs with an empty line." }),
                missionStatement: textarea("Mission statement", { max: 600, rows: 2 }),
                values: list("Values", point(), { summary: "title", itemLabel: "Value", max: 8 }),
            }),
            principals: group("Office of the Chairman", {
                heading: plainHeading("Section heading"),
                cta: cta(),
            }, { description: "Principals are leaders marked “Principal” in Leadership." }),
            executives: group("Executive leadership", { heading: plainHeading("Section heading") }),
            board: group("Board", {
                heading: group("Section heading", { eyebrow: text("Eyebrow", { max: 120, span: "half" }) }),
            }),
            governance: group("Governance", {
                heading: heading(),
                clauses: list("Clauses", point(), { summary: "title", itemLabel: "Clause", max: 10 }),
                footnote: textarea("Footnote", { max: 600, rows: 2 }),
            }),
        },
    },

    businesses: {
        key: "businesses",
        label: "Our Businesses",
        path: "/businesses",
        description: "Index page copy and the headings shared by every company page.",
        uses: [{ label: "Companies come from Businesses", href: "/admin/businesses" }],
        fields: {
            hero: hero(),
            outro: group("Group structure", {
                heading: plainHeading("Section heading"),
                body: textarea("Body", { max: 1500, rows: 4 }),
                links: list(
                    "Links",
                    {
                        label: text("Label", { max: 120, required: true, span: "half" }),
                        path: link("Link", { required: true, span: "half" }),
                    },
                    { summary: "label", itemLabel: "Link", max: 4 },
                ),
            }),
            detail: group("Company pages", {
                backLabel: text("Back link label", { max: 60, span: "half" }),
                companyEyebrow: text("Company eyebrow", { max: 60, span: "half" }),
                capabilities: plainHeading("“What it does” heading"),
                elsewhere: plainHeading("“Elsewhere in the group” heading"),
            }, { description: "Shared by every /businesses/… page." }),
        },
    },

    sustainability: {
        key: "sustainability",
        label: "Sustainability",
        path: "/sustainability",
        description: "Position figures, roadmap, ESG pillars and the reports section.",
        uses: [{ label: "Downloads come from Reports", href: "/admin/reports" }],
        fields: {
            hero: hero(),
            position: list("Position figures", metric("Optional suffix such as %."), { summary: ["label", "value"], itemLabel: "Figure", max: 6 }),
            roadmap: group("Roadmap", {
                heading: heading(),
                baselineYear: number("Baseline year", { min: 1900, max: 2200, span: "third" }),
                targetYear: number("Target year", { min: 1900, max: 2200, span: "third" }),
                milestones: list(
                    "Milestones",
                    {
                        year: number("Year", { min: 1900, max: 2200, required: true, span: "third" }),
                        phase: text("Phase", { max: 60, span: "third" }),
                        status: select("Status", [
                            { value: "complete", label: "Complete" },
                            { value: "active", label: "In progress" },
                            { value: "planned", label: "Planned" },
                        ], { span: "third", default: "planned", hint: "Set by hand: a slipped milestone stays visibly slipped." }),
                        title: text("Title", { max: 200, required: true }),
                        target: textarea("Target", { max: 400, rows: 2 }),
                        detail: textarea("Detail", { max: 1000, rows: 3 }),
                    },
                    { summary: ["year", "title"], itemLabel: "Milestone", max: 20 },
                ),
            }),
            esg: group("ESG framework", {
                heading: plainHeading("Section heading"),
                pillars: list(
                    "Pillars",
                    {
                        code: select("Code", [
                            { value: "E", label: "E — Environment" },
                            { value: "S", label: "S — Social" },
                            { value: "G", label: "G — Governance" },
                        ], { span: "third" }),
                        title: text("Title", { max: 80, required: true, span: "half" }),
                        statement: textarea("Statement", { max: 1000, rows: 3 }),
                        commitments: lines("Commitments", { itemMax: 300, max: 12, hint: "One per line." }),
                        metrics: list(
                            "Metrics",
                            {
                                label: text("Label", { max: 120, required: true, span: "half" }),
                                value: text("Value", { max: 40, required: true, span: "third" }),
                                unit: text("Unit", { max: 20, span: "third" }),
                                asOf: date("As of", { span: "third" }),
                            },
                            { summary: ["label", "value"], itemLabel: "Metric", max: 8 },
                        ),
                    },
                    { summary: ["code", "title"], itemLabel: "Pillar", max: 3 },
                ),
            }),
            reports: group("Reports section", {
                heading: heading(),
                footnote: textarea("Footnote", { max: 600, rows: 2 }),
            }, { description: "The documents themselves are managed under Reports." }),
            assuranceNote: textarea("Assurance note", { max: 800, rows: 3, hint: "Shown under the ESG pillars." }),
        },
    },

    innovation: {
        key: "innovation",
        label: "Innovation",
        path: "/innovation",
        description: "Research mandates, programme heading and the funding note.",
        uses: [{ label: "Programmes come from Ventures", href: "/admin/ventures" }],
        fields: {
            hero: hero(),
            focus: group("Research mandates", {
                heading: heading(),
                areas: list(
                    "Mandates",
                    {
                        title: text("Title", { max: 120, required: true, span: "half" }),
                        leadEntity: text("Lead entity", { max: 120, span: "half" }),
                        statement: textarea("Statement", { max: 300, rows: 2 }),
                        detail: textarea("Detail", { max: 1000, rows: 3 }),
                        disciplines: lines("Disciplines", { itemMax: 60, max: 10, rows: 3, hint: "One per line." }),
                    },
                    { summary: "title", itemLabel: "Mandate", max: 8 },
                ),
            }),
            ventures: group("Programmes section", { heading: plainHeading("Section heading") }),
            capitalNote: group("Funding note", {
                heading: plainHeading("Section heading"),
                body: textarea("Body", { max: 1000, rows: 4 }),
                cta: cta(),
            }),
        },
    },

    news: {
        key: "news",
        label: "Newsroom",
        path: "/news",
        description: "Newsroom hero and the lines shown around articles.",
        uses: [{ label: "Articles and categories", href: "/admin/articles" }],
        fields: {
            hero: hero(),
            articleFootnote: textarea("Article footnote", { max: 400, rows: 2, hint: "Printed under every article." }),
            emptyState: text("Empty category message", { max: 200 }),
        },
    },

    contact: {
        key: "contact",
        label: "Contact",
        path: "/contact",
        description: "Form copy, the office map and the global footprint.",
        uses: [
            { label: "Offices", href: "/admin/offices" },
            { label: "Inquiry desks (Settings)", href: "/admin/settings#inquiries" },
        ],
        fields: {
            hero: hero(),
            form: group("Inquiry form", {
                eyebrow: text("Eyebrow", { max: 120, span: "half" }),
                title: text("Title", { max: 200 }),
                note: textarea("Note above the form", { max: 400, rows: 2 }),
                submitLabel: text("Submit button", { max: 60, span: "half" }),
                submittingLabel: text("Button while sending", { max: 60, span: "half" }),
                successTitle: text("Success title", { max: 120 }),
                successBody: textarea("Success message", { max: 400, rows: 2 }),
                errorBody: textarea("Error message", { max: 400, rows: 2 }),
            }),
            locatedOffice: group("Office on the map", {
                officeKey: ref("Office", "offices", { span: "half", hint: "Its address is printed above the map. None hides the block." }),
                eyebrow: text("Eyebrow", { max: 120, span: "half" }),
                title: text("Title", { max: 200 }),
                note: textarea("Note", { max: 400, rows: 2 }),
                query: text("Google Maps search", { max: 300, hint: "The address Google Maps should look up." }),
                zoom: number("Zoom", { min: 1, max: 21, required: true, span: "third", hint: "1 = world, 21 = building." }),
                linkLabel: text("Map link label", { max: 60, span: "half" }),
            }),
            map: group("World map", {
                heading: plainHeading("Section heading"),
                caption: textarea("Caption", { max: 400, rows: 2 }),
            }, { description: "Markers are drawn from the Offices records." }),
            hubsEyebrow: text("Hubs list eyebrow", { max: 60 }),
        },
    },
};

export const PAGE_SPEC_KEYS = Object.keys(PAGE_SPECS);
