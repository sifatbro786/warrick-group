import mongoose, { Schema } from "mongoose";
import { baseOptions, href, linkSchema, reqStr, src, str, text } from "./_shared.js";

/**
 * Site-wide settings — a singleton (key: "site").
 * ---------------------------------------------------------------------------
 * Navbar, footer, inquiry routing and global SEO defaults. The "Our
 * Businesses" dropdown is NOT stored here: it is built from the Business
 * collection (name + descriptor + established), so a new company appears in
 * the menu the moment it is published.
 *
 * `inquiryTypes[].routeTo` is a server-only routing hint. The public data
 * layer must project it out — it is never sent to the browser.
 */

const navItemSchema = new Schema({
    label: reqStr(60),
    path: href({ required: true }),
    /** Renders the operating-companies dropdown under this item. */
    showBusinessesMenu: { type: Boolean, default: false },
});

const footerEntityLinkSchema = new Schema({
    label: reqStr(120),
    tagline: str(160),
    path: href({ required: true }),
});

const footerColumnSchema = new Schema({
    title: reqStr(60),
    links: { type: [linkSchema], default: [] },
});

const inquiryTypeSchema = new Schema({
    key: { type: String, required: true, trim: true, match: /^[a-z0-9-]+$/, maxlength: 60 },
    label: reqStr(120),
    routeTo: str(254, { lowercase: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"] }),
});

const siteSettingsSchema = new Schema(
    {
        key: { type: String, default: "site", enum: ["site"] },

        brand: {
            name: reqStr(80),
            legalName: reqStr(120),
            logo: src({ default: "/logo.png" }),
            /** Short paragraph under the wordmark in the footer. */
            footerDescription: text(400),
        },

        navigation: {
            main: { type: [navItemSchema], default: [] },
            cta: { label: str(40), path: href() },
            businessesMenu: {
                eyebrow: str(60),
                viewAllLabel: str(60),
                mobileViewAllLabel: str(40),
            },
        },

        footer: {
            entities: {
                title: str(60),
                links: { type: [footerEntityLinkSchema], default: [] },
            },
            columns: { type: [footerColumnSchema], default: [] },
            legal: { type: [linkSchema], default: [] },
            headOfficeTitle: str(60),
            cta: { label: str(60), path: href() },
            /** Rendered after "© {year} ". */
            copyright: str(160),
            status: {
                isVisible: { type: Boolean, default: true },
                label: str(60),
                state: str(40),
                locale: str(60),
            },
        },

        inquiryTypes: { type: [inquiryTypeSchema], default: [] },

        seo: {
            siteName: str(80),
            /** Must contain %s, e.g. "%s | Warrick Group". */
            titleTemplate: str(80, { match: [/%s/, "Template must contain %s"] }),
            defaultTitle: str(70),
            defaultDescription: str(170),
            defaultOgImage: src(),
            twitterHandle: str(30, { match: [/^(@\w{1,15})?$/, "Handle like @warrickgroup"] }),
            locale: str(10, { default: "en_GB" }),
            googleVerification: str(100),
            bingVerification: str(100),
            /** Social profiles for Organization JSON-LD `sameAs`. */
            sameAs: { type: [href()], default: [] },
        },
    },
    baseOptions,
);

siteSettingsSchema.index({ key: 1 }, { unique: true });

export const SiteSettings =
    mongoose.models.SiteSettings || mongoose.model("SiteSettings", siteSettingsSchema);
