# Warrick Group — Project Handbook & Phase Plan

> **For a new chat / new developer:** read this file first. It is the single
> source of truth for what this project is, the decisions already made, the
> conventions, and which phase we are in. Update the **Status** and the
> **Phase log** at the end of every phase.

---

## 1. What this project is

Corporate website for **Warrick Group / Warrick Corporation**, migrated from a
static React (Vite) site to a full-stack, database-driven Next.js app.

| | |
|---|---|
| Old site (design + content reference only, do not edit) | `E:\Works\Warrick\warrick-frontend` — React 19, Vite, react-router, Tailwind v4, framer-motion, swiper. Source of truth is GitHub `sifatbro786/warrick-frontend` @ `47ea952` (local copies may be behind — pull first). |
| **This project** | `E:\Works\Warrick\warrick-group` — Next.js **16.3.8** App Router, React 19.2, **JavaScript** (no TS), Tailwind v4, MongoDB + Mongoose 9, Node **24** |
| Backend | Inside Next.js (Server Components, Server Actions, Route Handlers). No separate Express server. |
| Mail | Nodemailer over SMTP (contact form → desk mailbox + acknowledgement to sender) |
| Hosting | Vercel first → later self-hosted on a Hostinger/Namecheap VPS (PM2 + Nginx) |
| Admin | `/admin` dashboard with sidebar. Roles: `super_admin`, `admin` |

### Non-negotiables (from the client)
1. **Design must not change.** Every public page is a 1:1 port of warrick-frontend.
2. **TopBar is removed**, along with its pages (`/investor-relations`, `/global-presence`, `/media-center`) and every link to them elsewhere.
3. **All content is dynamic** (MongoDB) and editable from the dashboard — except **Privacy, Terms, 404, error and loading pages, which stay static**.
4. Seed data = the exact content of the React site, so a fresh install looks identical.
5. Admin login: `solaimanislamsifat@gmail.com` / `11111111` (seeded super_admin).
6. `super_admin` can create admins; `admin` cannot manage users.
7. SEO controllable from the dashboard (dedicated SEO page). Whole site SEO-optimised.
8. Responsive (mobile / tablet / desktop), fast, secure.
9. Image uploads are stored on local disk (no Cloudinary).

> Note: Next.js 16 has breaking changes vs older versions. Before writing
> framework code, check `node_modules/next/dist/docs/` (see AGENTS.md).
> Key ones used here: `proxy.js` replaces `middleware.js`; `params`,
> `searchParams`, `cookies()`, `headers()` are async; `revalidateTag(tag, "max")`
> needs two args; `updateTag()` for read-your-own-writes; `next/image`
> only allows quality values listed in `images.qualities`.

---

## 2. Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation, models, seed | ✅ Done (2026-10-01) |
| 2 | Public site port (design 1:1) + contact form + static pages | ✅ Done (2026-10-01) |
| 3 | Auth (JWT) + admin shell + users + inquiries inbox | ⏳ Next |
| 4 | CMS for every page/collection + SEO manager + uploads + audit log | ☐ |
| 5 | SEO polish, performance, security hardening, deploy (Vercel + VPS) | ☐ |

---

## 3. Decisions already made (don't re-litigate)

| Topic | Decision | Why |
|---|---|---|
| TopBar links | Removed everywhere. Home "Corporate Inquiries" channels now point to `/contact?type=investor-relations` and `/contact?type=media` (form pre-selects the desk). Contact form inquiry types unchanged. | Client request; keeps the CTA design intact. |
| Placeholder pages | `/leadership`, `/board`, `/ethics-governance`, `/careers`, `/annual-reports`, `/brand-assets`, `/sitemap` are **not ported**. Kept as comments in `scripts/seed/data/site.js` (and in the route file in Phase 2). Footer links remapped: Leadership → `/about#leadership`, Board → `/about#board`, Governance → `/about#governance`, Annual Reports → `/sustainability#reports`; Careers, Brand Assets, Sitemap removed. | "Coming soon" pages are thin content and hurt SEO. Client wants them kept for later. |
| Uploads | Saved to `<project>/uploads/` (gitignored), served by a route handler at `/uploads/...` (Phase 4). On the VPS, Nginx serves that folder directly. | Files written into `public/` after build are **not** served by Next.js. Also: anything served from the site is public regardless of the repo being private. |
| Uploads on Vercel | Vercel's filesystem is read-only, so the upload button is disabled there with a message. Seed images and files in `public/` work everywhere. | Platform limitation. Storage goes through one module, so S3/R2 can be swapped in later. |
| Auth | Custom JWT (jose, HS256) in an httpOnly/Secure/SameSite cookie. argon2id password hashes. `tokenVersion` on the user for instant session revocation. | No extra auth vendor; works the same on Vercel and VPS. |
| Rate limiting | MongoDB TTL collection (`RateLimit`), not in-memory. | Vercel runs many instances; memory counters don't add up across them. |
| Data access | Public pages are Server Components reading Mongo **directly through the service layer** (no internal `fetch('/api/...')`). Cached with `"use cache"` + `cacheTag`; admin saves call `updateTag()`. | Static-site speed with dynamic content. |
| Article body | Plain-text paragraphs (`string[]`), rendered as text. | Zero XSS surface; matches the React contract. |
| Display ordinals ("01", "02") | Derived from position at render time, never stored. | Reordering can't produce duplicate numbers. |
| UI labels vs content | Section eyebrows/titles/intros/CTA labels → DB. Field labels ("Established", "min read"), validation messages, aria-labels → code. | Labels are interface, not content. |
| Language | JavaScript + JSDoc, matching the existing project. | Client's stack. |
| Build needs the DB | Pages prerender at `next build` from MongoDB, so `MONGODB_URI` must be set in the build environment too (Vercel: Project → Environment Variables, all environments). | Static HTML with live content; no request ever waits on Mongo. |
| Cache lifetime | Every public read is `"use cache"` + `cacheTag(TAGS.*)` + `cacheLife("hours")` (`server/services/_cache.js`). Tags are the real invalidation (Phase 4 calls `updateTag`); the hourly revalidate is a safety net for edits made outside the dashboard. | |
| Hero carousel | Swiper **core** attached in `useEffect` to server-rendered markup, not `swiper/react`. | `swiper/react` reads the clock during render, which Cache Components rejects in a prerender; a `<Suspense>` hole would delay the LCP image. Same DOM, so the hero keyframes never replay. |
| Scroll reveals | `components/motion/Reveal.js` (`<Stagger>` / `<Rise>`), client islands around server-rendered markup. | Sections stay Server Components; motion values identical to the React site. |
| News reader | Card → `/news/[slug]`. From `/news` it opens in the dialog via an intercepting route (`news/@modal/(.)[slug]`); a direct visit, refresh or crawler gets the full page `news/[slug]`. Home "latest news" links open the full page. | Same modal UX as React, plus a real URL per release for SEO and sharing. |
| Ventures | Listed **with** `detail` (6 small records) so the dialog opens instantly. | A second round trip per click buys nothing at this size. |
| Unknown slugs | `/businesses/x` and `/news/x` render the not-found page with `noindex` but HTTP **200** (soft 404). | Cache Components streams the static shell before the slug is checked. A real 404 needs a check in `proxy.js` — Phase 5. Unmatched paths (`/anything`) already return a real 404. |
| Contact `?type=` | Only the form reads search params, inside `<Suspense>`; the fallback is the same form with no desk selected. | The rest of /contact stays fully static. |
| Contact mail | Save inquiry → `after()` sends desk notice (to the desk's server-only `routeTo`, else `CONTACT_FALLBACK_INBOX`, Reply-To = visitor) + acknowledgement (echoes none of the visitor's text: no spam relay). Failures are written to `inquiry.mail.error`. | An SMTP outage never loses a lead. |
| Rate limit / IP | 5 inquiries / 10 min per IP hash. IP from `x-forwarded-for` (first hop), hashed with `IP_HASH_SALT`; raw IP never stored. **VPS:** Nginx must *overwrite* the header: `proxy_set_header X-Forwarded-For $remote_addr;`. | |
| Legal pages | `/privacy`, `/terms` are static files with plain-language copy describing what the site actually does. **Legal counsel must review before launch.** | Client: not CMS-managed. |

---

## 4. Folder structure

```
app/                       Next.js routes
  layout.js                fonts (next/font), root generateMetadata (SiteSettings.seo)
  not-found.js             unmatched URLs — 404 inside the site chrome
  global-error.js          last-resort error page (root layout failed)
  (site)/                  public pages (Phase 2)
    layout.js              SiteShell: skip link, Navbar, <main>, Footer
    page.js                home
    about/ businesses/ businesses/[slug]/ sustainability/ innovation/ contact/
    news/                  layout.js (@modal slot), page.js, [slug]/ (full page),
                           @modal/(.)[slug]/ (dialog), @modal/default.js
    privacy/ terms/        static legal pages
    not-found.js error.js loading.js
  admin/                   dashboard               (Phase 3–4)
  uploads/[...path]/       serves /uploads files   (Phase 4)
  globals.css              design tokens (ported 1:1)
components/
  layout/                  SiteShell, Navbar (client), Footer
  motion/Reveal.js         <Stagger>/<Rise> scroll reveals (client)
  ui/                      ArrowLink, Plate (next/image frame), PageHero, SectionHeading
  dialog/Dialog.js         the one modal shell (client)
  home/ businesses/ innovation/ news/ contact/ legal/   page sections
  NotFoundView.js ErrorView.js
lib/                       format.js (dates, ordinals, labels, maps URLs), cn.js
server/                    server-only code — never import from a Client Component
  env.js                   Zod-validated env, grouped by feature
  db/connect.js            cached Mongoose connection
  auth/password.js         argon2id hash/verify
  models/                  Mongoose models (+ index.js barrel)
  services/                business logic / data access
    _cache.js              TAGS + CONTENT_LIFE + toPlain()  ← Phase 4 updateTag() uses TAGS
    content.js             cached public reads (pages, businesses, news, leaders…)
    seo.js                 buildRootMetadata / buildPageMetadata
    inquiry.js mail.js rate-limit.js request.js
  validators/              Zod input schemas (contact.js)
  actions/                 Server Actions (contact.js)
scripts/seed/              seed script + data/ (content snapshot of warrick-frontend)
uploads/                   admin uploads (gitignored)
public/                    logo.png, asma.jpeg, warrick.jpeg
```

Import alias: `@/` → project root (`@/server/models`, `@/components/...`).

---

## 5. Data model

All models live in `server/models/`. Shared building blocks are in `_shared.js`.

| Collection | Model | Purpose | Key |
|---|---|---|---|
| `users` | User | dashboard accounts, roles, lockout, tokenVersion | `email` |
| `pages` | Page + 7 discriminators | section copy for home, about, businesses, sustainability, innovation, news, contact | `key` |
| `sitesettings` | SiteSettings | navbar, footer, inquiry routing (`routeTo` is server-only), global SEO defaults | `key: "site"` |
| `seosettings` | SeoSetting | per-route title/description/OG/noindex + sitemap priority | `key`, `path` |
| `businesses` | Business | operating companies → `/businesses/[slug]`; also builds the nav dropdown | `slug` |
| `newscategories` | NewsCategory | news filter tabs | `key` |
| `articles` | Article | newsroom → `/news`, `/news/[slug]` | `slug` |
| `leaders` | Leader | about page: principals, executives, board | `key` |
| `ventures` | Venture | innovation programmes | `slug` |
| `reports` | Report | sustainability downloads | title + period |
| `offices` | Office | contact page, maps, footer head office (one `isHeadquarters`) | `key` |
| `inquiries` | Inquiry | contact submissions (saved before mail is sent) | `reference` |
| `auditlogs` | AuditLog | who changed what (TTL 365 days) | — |
| `ratelimits` | RateLimit | login / contact throttling (TTL) | `key` |

Every link/image field an admin can type is validated: links must be an
internal path, `#anchor`, `https://`, `mailto:` or `tel:` (no `javascript:`,
no `//host`); images must be a local path or `https://`.

---

## 6. Conventions

- **Server boundary:** files under `server/services`, `server/actions` start
  with `import "server-only"`. Models, `db/connect.js`, `env.js` and
  `auth/password.js` do **not**, because the seed script runs them in plain Node.
- **Every Server Action re-checks the session and role.** Actions are public
  POST endpoints; hiding a button is not authorization.
- **Validation:** Zod at every boundary (form → action, route handler). Mongoose
  validation is the second line.
- **Mongo filters:** `sanitizeFilter` is on globally. Filters that legitimately
  use operators from server code must be wrapped: `{ status: mongoose.trusted({ $in: [...] }) }`.
- **Reads:** `.lean()` + projections. List queries never load bodies
  (`-content`, `-detail`).
- **Images:** `next/image`. Allowed qualities: 70, 75, 85.
- **Env:** read only through `server/env.js` getters (`dbEnv()`, `mailEnv()`…).
- **Before delivery:** `npx eslint .` and an esbuild syntax pass must be clean.

---

## 7. Environment & commands

Copy `.env.example` → `.env.local` and fill in `MONGODB_URI`, `SMTP_*`, `IP_HASH_SALT`, `JWT_SECRET`.

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run seed` | insert any missing content + the super_admin. **Safe to re-run**: never overwrites admin edits |
| `npm run seed:reset` | overwrite seeded docs with the original content (dashboard-created docs are kept) — not for production |
| `npm run seed -- --reset-admin` | reset the seeded super_admin's password from `.env.local` and unlock it |
| `npm run build` / `npm start` | production build / serve |

---

## 8. Phase plan

### Phase 1 — Foundation, models, seed ✅
- Dependencies, Node 24 (`engines`, `.nvmrc`), `"type": "module"`.
- `next.config.mjs`: security headers, image config, `poweredByHeader: false`.
- Design tokens ported to `app/globals.css`; fonts self-hosted via `next/font`.
- Zod env validation, cached DB connection, all models, idempotent seed.

### Phase 2 — Public site port
- Root layout: Navbar + Footer (no TopBar), skip link, `generateMetadata` from `SeoSetting`.
- Pages: `/`, `/about`, `/businesses`, `/businesses/[slug]`, `/sustainability`, `/innovation`, `/news` (+ `/news/[slug]` via intercepting route so the modal UX stays), `/contact`, static `/privacy`, `/terms`.
- `not-found`, `error`, `global-error`, `loading`.
- Server Components by default; client islands only for hero Swiper, nav menu, dialogs, news filter, contact form.
- Service layer with `"use cache"` + `cacheTag` (enable `cacheComponents`).
- Contact: Server Action → Zod → rate limit → save Inquiry → Nodemailer (desk + acknowledgement) via `after()`; header-injection safe; honeypot.
- Add section anchors: `#leadership`, `#board`, `#governance`, `#reports`.
- Placeholder routes kept as a commented list in code.

### Phase 3 — Auth + admin shell
- `/admin/login`, JWT session cookie, `proxy.js` optimistic redirect, DAL `verifySession()`.
- Login rate limit + account lockout; change password; log out everywhere.
- Users module (super_admin only): create, deactivate, reset password, role change; last-super_admin guard.
- Sidebar layout (collapsible, mobile drawer), dashboard overview, inquiries inbox.
- UI kit: shadcn/ui, react-hook-form, sonner.

### Phase 4 — CMS
- Editors for every page document and collection (nested arrays with add/remove/reorder).
- SEO manager (global + per-route + per-item overrides) and Site settings (nav, footer, inquiry routing, SMTP test).
- Local uploads (type/size validation, random filenames, `/uploads` route), image picker.
- `updateTag()` on save, audit log.

### Phase 5 — Hardening & deploy
- `sitemap.js`, `robots.js`, JSON-LD (Organization, WebSite, BreadcrumbList, NewsArticle), dynamic OG images.
- Lighthouse ≥ 95, bundle analysis, `LazyMotion`, LCP preload; responsive QA at 360/768/1024/1440.
- CSP, final header review, dependency audit.
- Vercel deploy guide;

---

## 9. Known content issues (carried over from the React site)

These are seeded exactly as the React site rendered them. Fix from the dashboard.
- **Home → Founder block:** shows **Asma Akbar** with her photo, but the title
  and quote are Warrick's ("Founder & Executive Chairman"). The React
  component hardcoded her name/photo over Warrick's data. On About she is
  "Co-Founder & Vice Chairwoman".
- **Home → News:** now shows the latest 3 published articles. The Clara item's
  category reads "Technology" (its real category) instead of the "E-Commerce"
  that was hardcoded on the old home page.
- **Report PDFs** (`/reports/*.pdf`) don't exist, so the links 404 until the files are uploaded.
- **Footer hubs order** now follows the Office records (London · Dubai · Singapore · Dhaka); the React footer had its own hard-coded list (… Dhaka · Singapore). Reorder offices from the dashboard if needed — the contact page uses the same order.
- All Unsplash photos and most copy/figures are placeholders, and so is the
  Executive/Board roster except Warrick and Asma.

---

## 10. Phase log

### Phase 1 — 2026-10-01
**Added:** `PHASES.md`, `.nvmrc`, `.env.example`, `server/` (env, db, auth/password, 14 models), `scripts/seed/` (script + 9 data modules), `public/` images.
**Changed:** `package.json`, `next.config.mjs`, `app/globals.css`, `app/layout.js`, `.gitignore`, `eslint.config.mjs`, `CLAUDE.md`.
**Verified:** all 54 seed documents pass schema validation with no field dropped; unsafe links/images, bad slugs and non-E.164 phones are rejected; `next build` and eslint are clean.
**Not verified here:** the seed's write path against a live database (no MongoDB available in the build sandbox). First real run happens on the developer machine.

### Phase 2 — 2026-10-01
**Added:** `app/(site)/**` (home, about, businesses + `[slug]`, sustainability, innovation, news + `[slug]` + modal, contact, privacy, terms, not-found, error, loading), `app/not-found.js`, `app/global-error.js`, `components/**`, `lib/`, `server/services/*`, `server/validators/contact.js`, `server/actions/contact.js`, dependency `nodemailer`.
**Changed:** `app/layout.js` (generateMetadata), `next.config.mjs` (`cacheComponents: true`), `server/env.js` (+`security` group), `.env.example` (+`IP_HASH_SALT`), `app/globals.css` (+`loading-rule` keyframes). **Removed:** `app/page.js` (moved to `app/(site)/page.js`).
**Verified (against a seeded database):** `next build` prerenders all 35 routes as static; eslint and an esbuild syntax pass are clean. Screenshot diff vs warrick-frontend at 1440px and 390px on all 9 pages: identical except the removed TopBar (36px) and the removed footer links. No console or hydration errors. Hero (autoplay, arrows, entity strip, rewind), Businesses dropdown, mobile drawer, news filter, news dialog (open/close/reopen, browser back/forward), direct article URL, venture dialog, `/contact?type=media` preselect, 404s. Contact: client + server validation, inquiry saved, rate limit trips on the 6th submit, desk mail + acknowledgement delivered to a test SMTP server, SMTP failure recorded on the inquiry.
**Not verified here:** Google Fonts download at build (sandbox has no access; fonts were swapped for local copies only for testing) and real Unsplash images (stubbed).

