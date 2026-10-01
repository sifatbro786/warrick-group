import mongoose, { Schema } from "mongoose";
import {
    baseOptions,
    headingSchema,
    href,
    imageSchema,
    linkSchema,
    metricSchema,
    paragraphs,
    pointSchema,
    reqStr,
    str,
    text,
} from "./_shared.js";

/**
 * Page content singletons — one document per public page.
 * ---------------------------------------------------------------------------
 * Every page shares the `pages` collection and is told apart by `key`
 * (a Mongoose discriminator). Each key gets its own strictly typed schema
 * below, so an admin form for the About page can never write Home fields.
 *
 * What lives here vs. its own collection:
 *   - Section copy and short fixed lists (stats, pillars, roadmap) → here.
 *   - Anything with its own URL/detail or that grows over time
 *     (businesses, articles, leaders, ventures, reports, offices) → own
 *     collection, queried by the page.
 *
 * What stays in code: field labels ("Established", "min read"), form
 * validation messages and aria-labels. They are interface, not content.
 *
 * Privacy / Terms / 404 are static by design and have no document here.
 */

export const PAGE_KEYS = Object.freeze([
    "home",
    "about",
    "businesses",
    "sustainability",
    "innovation",
    "news",
    "contact",
]);

const sub = (definition) => new Schema(definition, { _id: false });

const heroSchema = sub({ eyebrow: str(120), title: str(300), lead: text(1500) });
const ctaSchema = sub({ label: str(80), path: href() });

/* ---- Base --------------------------------------------------------------- */

const pageSchema = new Schema(
    {
        updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    { ...baseOptions, discriminatorKey: "key", collection: "pages" },
);

pageSchema.index({ key: 1 }, { unique: true });

export const Page = mongoose.models.Page || mongoose.model("Page", pageSchema);

/* ---- Home --------------------------------------------------------------- */

const homeSchema = new Schema({
    hero: {
        /** Screen-reader heading for the carousel (visually hidden h1). */
        srHeading: str(300),
        slides: {
            type: [
                new Schema({
                    name: reqStr(120),
                    sector: str(120),
                    headline: reqStr(200),
                    body: text(600),
                    ctaLabel: str(60),
                    path: href(),
                    image: { type: imageSchema, required: true },
                }),
            ],
            default: [],
        },
    },
    stats: {
        heading: { type: headingSchema, default: () => ({}) },
        /** `unit` holds the gold trailing glyph: "+" or "%". */
        items: { type: [metricSchema], default: [] },
    },
    founder: {
        eyebrow: str(120),
        title: str(300),
        image: { type: imageSchema, default: null },
        name: str(120),
        role: str(160),
        quote: text(600),
        paragraphs: paragraphs(),
        pillars: { type: [pointSchema], default: [] },
        cta: { type: ctaSchema, default: () => ({}) },
    },
    portfolio: {
        heading: { type: headingSchema, default: () => ({}) },
        itemCtaLabel: str(60),
        items: {
            type: [
                new Schema({
                    name: reqStr(120),
                    sector: str(160),
                    summary: text(800),
                    path: href(),
                    image: { type: imageSchema, required: true },
                }),
            ],
            default: [],
        },
    },
    brands: {
        heading: { type: headingSchema, default: () => ({}) },
        items: {
            type: [
                new Schema({
                    name: reqStr(120),
                    type: { type: String, enum: ["entity", "partner"], default: "partner" },
                }),
            ],
            default: [],
        },
    },
    commitment: {
        heading: { type: headingSchema, default: () => ({}) },
        image: { type: imageSchema, default: null },
        values: { type: [pointSchema], default: [] },
    },
    news: {
        heading: { type: headingSchema, default: () => ({}) },
        cta: { type: ctaSchema, default: () => ({}) },
        /** How many latest published articles the home page shows. */
        limit: { type: Number, min: 1, max: 9, default: 3 },
    },
    inquiry: {
        heading: { type: headingSchema, default: () => ({}) },
        statement: text(800),
        channels: {
            type: [new Schema({ label: reqStr(120), detail: text(300), path: href({ required: true }) })],
            default: [],
        },
    },
});

/* ---- About -------------------------------------------------------------- */

const aboutSchema = new Schema({
    hero: {
        eyebrow: str(120),
        title: str(300),
        lead: text(1500),
        meta: { type: [new Schema({ label: reqStr(60), value: reqStr(40) })], default: [] },
    },
    story: {
        eyebrow: str(120),
        title: str(300),
        history: paragraphs(),
        missionStatement: text(600),
        values: { type: [pointSchema], default: [] },
    },
    /** Principals come from Leader (isPrincipal: true). */
    principals: {
        heading: { type: headingSchema, default: () => ({}) },
        cta: { type: ctaSchema, default: () => ({}) },
    },
    executives: { heading: { type: headingSchema, default: () => ({}) } },
    board: { heading: { type: headingSchema, default: () => ({}) } },
    governance: {
        heading: { type: headingSchema, default: () => ({}) },
        clauses: { type: [pointSchema], default: [] },
        footnote: text(600),
    },
});

/* ---- Businesses (index + shared detail-page copy) ----------------------- */

const businessesSchema = new Schema({
    hero: { type: heroSchema, default: () => ({}) },
    outro: {
        heading: { type: headingSchema, default: () => ({}) },
        body: text(1500),
        links: { type: [linkSchema], default: [] },
    },
    /** Section headings shared by every /businesses/[slug] page. */
    detail: {
        backLabel: str(60),
        companyEyebrow: str(60),
        capabilities: { type: headingSchema, default: () => ({}) },
        elsewhere: { type: headingSchema, default: () => ({}) },
    },
});

/* ---- Sustainability ----------------------------------------------------- */

const sustainabilitySchema = new Schema({
    hero: { type: heroSchema, default: () => ({}) },
    position: { type: [metricSchema], default: [] },
    roadmap: {
        heading: { type: headingSchema, default: () => ({}) },
        baselineYear: { type: Number, min: 1900, max: 2200 },
        targetYear: { type: Number, min: 1900, max: 2200 },
        /** `status` is set by the owner, never derived from `year`: a slipped
            milestone must stay visibly slipped. */
        milestones: {
            type: [
                new Schema({
                    year: { type: Number, required: true, min: 1900, max: 2200 },
                    phase: str(60),
                    title: reqStr(200),
                    target: text(400),
                    detail: text(1000),
                    status: { type: String, enum: ["complete", "active", "planned"], default: "planned" },
                }),
            ],
            default: [],
        },
    },
    esg: {
        heading: { type: headingSchema, default: () => ({}) },
        pillars: {
            type: [
                new Schema({
                    code: { type: String, enum: ["E", "S", "G"], required: true },
                    title: reqStr(80),
                    statement: text(1000),
                    commitments: { type: [{ type: String, trim: true, maxlength: 300 }], default: [] },
                    metrics: {
                        type: [
                            new Schema({
                                label: reqStr(120),
                                value: reqStr(40),
                                unit: str(20, { default: "" }),
                                asOf: { type: Date, default: null },
                            }),
                        ],
                        default: [],
                    },
                }),
            ],
            default: [],
        },
    },
    /** Report records come from the Report collection. */
    reports: {
        heading: { type: headingSchema, default: () => ({}) },
        footnote: text(600),
    },
    assuranceNote: text(800),
});

/* ---- Innovation --------------------------------------------------------- */

const innovationSchema = new Schema({
    hero: { type: heroSchema, default: () => ({}) },
    focus: {
        heading: { type: headingSchema, default: () => ({}) },
        areas: {
            type: [
                new Schema({
                    title: reqStr(120),
                    statement: text(300),
                    detail: text(1000),
                    disciplines: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
                    leadEntity: str(120),
                }),
            ],
            default: [],
        },
    },
    /** Venture records come from the Venture collection. */
    ventures: { heading: { type: headingSchema, default: () => ({}) } },
    capitalNote: {
        heading: { type: headingSchema, default: () => ({}) },
        body: text(1000),
        cta: { type: ctaSchema, default: () => ({}) },
    },
});

/* ---- News --------------------------------------------------------------- */

const newsSchema = new Schema({
    hero: { type: heroSchema, default: () => ({}) },
    /** Line under every article body. */
    articleFootnote: text(400),
    emptyState: str(200),
});

/* ---- Contact ------------------------------------------------------------ */

const contactSchema = new Schema({
    hero: { type: heroSchema, default: () => ({}) },
    form: {
        eyebrow: str(120),
        title: str(200),
        note: text(400),
        submitLabel: str(60),
        submittingLabel: str(60),
        successTitle: str(120),
        successBody: text(400),
        errorBody: text(400),
    },
    /** Google Maps embed under the form. `officeKey` → Office.key. */
    locatedOffice: {
        officeKey: str(60),
        eyebrow: str(120),
        title: str(200),
        note: text(400),
        linkLabel: str(60),
        query: str(300),
        zoom: { type: Number, min: 1, max: 21, default: 15 },
    },
    /** Schematic world map. */
    map: {
        heading: { type: headingSchema, default: () => ({}) },
        caption: text(400),
    },
    hubsEyebrow: str(60),
});

/* ---- Register discriminators (guarded for dev hot reload) --------------- */

const register = (key, schema) =>
    Page.discriminators?.[key] ?? Page.discriminator(key, schema, key);

export const HomePage = register("home", homeSchema);
export const AboutPage = register("about", aboutSchema);
export const BusinessesPage = register("businesses", businessesSchema);
export const SustainabilityPage = register("sustainability", sustainabilitySchema);
export const InnovationPage = register("innovation", innovationSchema);
export const NewsPage = register("news", newsSchema);
export const ContactPage = register("contact", contactSchema);

export const PAGE_MODELS = Object.freeze({
    home: HomePage,
    about: AboutPage,
    businesses: BusinessesPage,
    sustainability: SustainabilityPage,
    innovation: InnovationPage,
    news: NewsPage,
    contact: ContactPage,
});
