/**
 * Database seed
 * ===========================================================================
 *   npm run seed                 Insert anything missing. Existing documents
 *                                are left alone, so admin edits are safe.
 *   npm run seed:reset           Overwrite seeded documents with the original
 *                                content. Documents created from the
 *                                dashboard are not deleted. Asks no questions:
 *                                don't run it on production by accident.
 *   npm run seed -- --reset-admin
 *                                Reset the seed super_admin's password to
 *                                SEED_SUPER_ADMIN_PASSWORD and unlock it.
 *                                Use when locked out.
 *
 * Reads .env / .env.local (see package.json). Every document goes through
 * Mongoose validation, so seed data that breaks a schema rule fails loudly
 * here instead of rendering broken on the site.
 */
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../../server/db/connect.js";
import { hashPassword } from "../../server/auth/password.js";
import {
    Article,
    AuditLog,
    Business,
    Inquiry,
    Leader,
    Media,
    NewsCategory,
    Office,
    Page,
    PAGE_MODELS,
    RateLimit,
    Report,
    ROLES,
    SeoSetting,
    SiteSettings,
    User,
    Venture,
} from "../../server/models/index.js";

import businesses from "./data/businesses.js";
import leaders from "./data/leaders.js";
import news from "./data/news.js";
import offices from "./data/offices.js";
import pages from "./data/pages.js";
import reports from "./data/reports.js";
import seo from "./data/seo.js";
import site from "./data/site.js";
import ventures from "./data/ventures.js";

const args = new Set(process.argv.slice(2));
const RESET = args.has("--reset");
const RESET_ADMIN = args.has("--reset-admin");

const stats = [];

/**
 * Insert `data` if nothing matches `filter`; with --reset, overwrite the
 * match instead. Returns the saved document.
 */
async function upsert(Model, filter, data, label) {
    const existing = await Model.findOne(filter);
    let action = "kept";
    let doc = existing;

    if (!existing) {
        doc = await Model.create(data);
        action = "created";
    } else if (RESET) {
        existing.overwrite(data);
        doc = await existing.save();
        action = "reset";
    }

    stats.push({ label, action });
    return doc;
}

async function seedCollection(Model, items, keyField, name) {
    for (const item of items) {
        await upsert(Model, { [keyField]: item[keyField] }, item, `${name}:${item[keyField]}`);
    }
}

async function seedSuperAdmin() {
    const email = process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
    const name = process.env.SEED_SUPER_ADMIN_NAME?.trim() || "Super Admin";

    if (!email || !password) {
        console.warn("! SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD not set — skipping super_admin.");
        return;
    }

    const existing = await User.findOne({ email });

    if (!existing) {
        await User.create({
            name,
            email,
            role: ROLES.SUPER_ADMIN,
            passwordHash: await hashPassword(password),
            passwordChangedAt: new Date(),
        });
        stats.push({ label: `user:${email}`, action: "created (super_admin)" });
        return;
    }

    if (RESET_ADMIN) {
        existing.passwordHash = await hashPassword(password);
        existing.role = ROLES.SUPER_ADMIN;
        existing.isActive = true;
        existing.failedLogins = 0;
        existing.lockUntil = null;
        existing.passwordChangedAt = new Date();
        existing.tokenVersion += 1; // end every existing session
        await existing.save();
        stats.push({ label: `user:${email}`, action: "password reset + unlocked" });
        return;
    }

    stats.push({ label: `user:${email}`, action: "kept" });
}

async function main() {
    const started = Date.now();
    await connectDB();
    console.log(`→ Connected to ${mongoose.connection.name}${RESET ? "  (RESET mode)" : ""}`);

    /* Build/refresh indexes first so unique constraints exist before writes. */
    for (const model of [
        User, Business, NewsCategory, Article, Leader, Venture, Report, Office,
        SeoSetting, SiteSettings, Page, Inquiry, AuditLog, RateLimit, Media,
    ]) {
        await model.syncIndexes();
    }

    await upsert(SiteSettings, { key: "site" }, site, "site-settings");

    for (const [key, content] of Object.entries(pages)) {
        const Model = PAGE_MODELS[key];
        if (!Model) throw new Error(`Unknown page key in seed data: ${key}`);
        await upsert(Model, {}, { key, ...content }, `page:${key}`);
    }

    await seedCollection(SeoSetting, seo, "key", "seo");
    await seedCollection(Business, businesses, "slug", "business");
    await seedCollection(Leader, leaders, "key", "leader");
    await seedCollection(Venture, ventures, "slug", "venture");
    await seedCollection(Office, offices, "key", "office");
    await seedCollection(NewsCategory, news.categories, "key", "news-category");

    /* Articles reference categories by ObjectId. */
    const categoryIds = Object.fromEntries(
        (await NewsCategory.find({}, { key: 1 }).lean()).map((c) => [c.key, c._id]),
    );
    for (const article of news.articles) {
        const category = categoryIds[article.category];
        if (!category) throw new Error(`Article "${article.slug}" has unknown category "${article.category}"`);
        await upsert(Article, { slug: article.slug }, { ...article, category }, `article:${article.slug}`);
    }

    /* Reports have no slug; title + period identifies an edition. */
    for (const report of reports) {
        await upsert(
            Report,
            { title: report.title, period: report.period },
            report,
            `report:${report.title} (${report.period})`,
        );
    }

    await seedSuperAdmin();

    const summary = stats.reduce((acc, { action }) => ({ ...acc, [action]: (acc[action] ?? 0) + 1 }), {});
    console.log(
        `✓ Seed finished in ${((Date.now() - started) / 1000).toFixed(1)}s —`,
        Object.entries(summary).map(([k, v]) => `${v} ${k}`).join(", "),
    );
    if (process.env.DEBUG_SEED) console.table(stats);
}

main()
    .catch((error) => {
        console.error("✗ Seed failed:\n", error?.message ?? error);
        if (error?.errors) {
            for (const [path, err] of Object.entries(error.errors)) console.error(`  - ${path}: ${err.message}`);
        }
        process.exitCode = 1;
    })
    .finally(disconnectDB);
