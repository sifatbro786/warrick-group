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
| 3 | Auth (JWT) + admin shell + users + inquiries inbox | ✅ Done (2026-10-03) |
| 4 | CMS for every page/collection + SEO manager + uploads + audit log | ✅ Done (2026-10-03) |
| 5 | SEO polish, performance, security hardening, deploy (Vercel + VPS) | ⏳ Next |

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
| Session | JWT claims `sub`, `tv` (tokenVersion), `at` (login time); **no role claim** — role is read from the DB on every request. 12 h lifetime, `proxy.js` re-signs past half-life, hard cap 7 days from login. Cookie `__Host-wg_session` when `NEXT_PUBLIC_SITE_URL` is https, `wg_session` on plain-http local runs. httpOnly, SameSite=Lax. | Demotion/deactivation bite on the next click; no session table. |
| Auth layers | `proxy.js` = signature/expiry only, redirects to `/admin/login?next=`. `server/auth/dal.js` = the real check (user exists, active, tokenVersion matches), run by **every** admin page (`requireUser`/`requireSuperAdmin`) and every action (`authorize`). `/admin/login` is never redirected by the proxy (a signed-but-revoked token would loop); the page asks the DAL. | Layouts don't re-run on client navigation, so the panel layout is chrome, not a guard. |
| Login brakes | 20 attempts / 15 min per IP hash (RateLimit) + 5 consecutive failures lock the account 15 min (`failedLogins`/`lockUntil`, atomic `$inc`). Unknown email verifies against a dummy argon2 hash (same timing). Deactivated account answers like a wrong password. Same message for IP throttle and account lock. | |
| Password policy | Dashboard-set passwords ≥ 12 chars, ≥ 5 distinct chars, ≤ 128. Login only checks presence (seeded `11111111` predates the policy — **change it before launch**). Own change re-issues this session's cookie (keeps login time) and ends every other session. | |
| User rules | super_admin only (checked in every action). Nobody changes own role / deactivates self / resets own password from Users (Account page instead). Last active super_admin can't be demoted or deactivated. Deactivate + reset bump tokenVersion. No hard delete (audit log references users). | |
| Inquiries inbox | Views: Inbox (new+read), Unread, Archived, All; desk filter; search (escaped regex over name/email/subject/reference); 20 per page; query string Zod-parsed with fallbacks. Opening an inquiry marks it read **from a client effect**, never during render (a prefetch must not mark mail read). Any admin triages; only super_admin deletes. | |
| Admin rendering | All `/admin` is per-request (`export const instant = false` on `app/admin/layout.js`); the session read sits inside `<Suspense>` in `app/admin/(panel)/layout.js`. Admin reads are uncached direct service calls; actions call `refresh()`. Public routes are still fully static. `X-Robots-Tag: noindex` + `Cache-Control: private, no-store` on every /admin response. | Cache Components rule: request data only behind Suspense. |
| Admin forms | `lib/admin/useServerForm.js` = react-hook-form + zodResolver + Server Action. The **same Zod schema** (`server/validators/*`, plain Zod, no server imports) runs in the browser and inside the action. Action result contract: `{ status: "success"|"invalid"|"error", errors?, message? }`. | One pattern for every Phase 4 editor. |
| Admin UI kit | Hand-written shadcn-style components on `radix-ui` (Dialog, AlertDialog, DropdownMenu, Tooltip, Slot) in `components/admin/ui/`, sonner toasts, lucide icons. No shadcn CLI / extra CSS framework. Overlay motion in `app/admin/admin.css` (admin-only). | Brand tokens reused; public bundle untouched. |
| Admin time zone | Dates render on the server pinned to `Asia/Dhaka` (`lib/admin/format.js`). | Vercel runs in UTC. |
| Legal pages | `/privacy`, `/terms` are static files with plain-language copy describing what the site actually does. **Legal counsel must review before launch.** | Client: not CMS-managed. |
| CMS specs | Every editor is a declarative field tree in `server/validators/cms/` (pages.js, collections.js, site.js). One spec produces the Zod schema (browser + Server Action), the form defaults (`toForm`) and the UI (`components/admin/cms/FieldRenderer.js`). `npm run check:cms` round-trips every seed document through spec → Zod → Mongoose and fails if any model path has no field. | Adding a field = one line in the spec + the model. Client and server can't disagree. |
| CMS saves | Pages and records are saved whole (`doc.overwrite`) after the spec's Zod parse; settings sections write only their own subtree and validate only modified paths. Uniqueness is pre-checked (field error), the unique index is the backstop. Errors on paths the form doesn't render become a form-level message, never a silent no-op. | |
| Concurrency | Page, record and route-SEO saves carry the `updatedAt` the screen loaded; a mismatch returns "Someone else saved this…" instead of overwriting. Settings sections are last-write-wins per section (they never touch each other). | Two admins, two tabs, no lost work. |
| Cache invalidation | Every CMS action calls `updateTag()` for the tags the write affects (`TAGS.page(key)`, `businesses`, `news`, `site`, `seo`…) then `refresh()`. Renaming an office key also rewrites the contact page's map key and invalidates `page:contact`. | Public pages stay static and update on the next request. |
| Who can do what | Any admin: edit pages, records, settings, SEO, upload. super_admin only: delete records/media, edit inquiry desks (where leads are emailed). Checked in every action. | Same rule as Phase 3's inbox. |
| Publishing | Records have a Published/Hidden switch on the list and in the editor (articles use their Draft/Published status). Order is set with up/down arrows on the list (one request writes the whole order, optimistic UI). | |
| Images in content | Stored as `{ url, alt, focal }`. The picker offers the media library, upload, or a pasted URL. Clicking the preview sets the focal point (CSS object-position). | |
| Remote image hosts | `lib/images.js` lists hosts next/image may optimise (feeds `remotePatterns`). `components/ui/SmartImage.js` (drop-in for next/image in public components) renders any other https host **unoptimised** instead of throwing. `images.localPatterns` forbids query strings on local images. | A pasted URL can never take a page down. |
| Uploads | `POST /api/admin/media` (Route Handler, outside `/admin` so proxy.js doesn't buffer it). DAL session check + `X-WG-Upload` header + Sec-Fetch-Site (CSRF), 60 uploads / 10 min per user, size ≤ `UPLOAD_MAX_MB`. Type from the file's bytes (JPG, PNG, WebP, AVIF, GIF, PDF — no SVG/HTML). Images re-encoded by sharp: EXIF/GPS stripped, rotation fixed, longest edge ≤ 3000px. Saved as `uploads/YYYY/MM/<32 hex>.<ext>`; a `Media` record indexes it. Served by `app/uploads/[...path]/route.js` (strict segment whitelist, nosniff, sandbox CSP, immutable cache). | |
| Media deletes | Refused while any document still uses the URL (usage scan over every content collection). | No broken images from a cleanup. |
| SMTP settings | Stay in the server env. Settings shows host/user/fallback (never the password) and sends a test email to the signed-in admin (3 / 10 min). | Credentials never pass through the dashboard. |
| Native submit | Every JS-handled admin form has `method="post"`. | If a click lands before hydration, a native submit must never put a password in the URL (found and fixed in Phase 4 testing). |
| Instant-navigation check | Every page under `app/admin/(panel)/` exports `instant = false`. `instant` is per segment: the `false` on `app/admin/layout.js` does not reach child pages, and Next 16's dev-only check would report each session-reading page as "uncached data … outside <Suspense>". Public pages keep the default (validated). | Dashboard pages are per-request by design. |
| List keys | Public lists use `key={itemKey(item, index)}` (`lib/format.js`): the string `_id`, else the position. On a client component, put `key` **before** any `{...spread}`: after it, JSX compiles to `createElement` and React warns that the element's children are an unkeyed list. | Found via a dev warning in FounderSection. |
| Smooth scroll | `<html data-scroll-behavior="smooth">` so Next turns off the `scroll-behavior: smooth` from globals.css during route changes. | Next 16 dev notice. |
| Atlas SRV DNS | Optional `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1` → `dns.setServers()` before connecting. Fixes `querySrv ECONNREFUSED` when the Windows/ISP resolver refuses SRV lookups for `mongodb+srv://`. | Hit on the developer machine. |

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
  admin/                   dashboard
    layout.js              noindex metadata, Toaster, admin.css, instant = false
    login/                 sign-in (brand panel + form; DAL gate in Suspense)
    (panel)/               signed-in area: layout (AdminShell in Suspense), loading, error, not-found
      page.js              overview
      inquiries/ inquiries/[id]/  inbox + reader
      users/               super_admin only
      account/             profile, password, sign out everywhere
      pages/ pages/[key]/  page list + page editor (Phase 4)
      [collection]/        businesses, articles, categories, leaders, ventures, reports, offices:
                           list (/admin/<kind>), new, [id]   — validated against the registry
      media/ seo/ settings/ activity/
  api/admin/media/         upload endpoint (POST, multipart)
  uploads/[...path]/       serves /uploads files
  globals.css              design tokens (ported 1:1)
components/
  layout/                  SiteShell, Navbar (client), Footer
  motion/Reveal.js         <Stagger>/<Rise> scroll reveals (client)
  ui/                      ArrowLink, Plate (next/image frame), PageHero, SectionHeading,
                           SmartImage (next/image that never throws on an unknown host)
  dialog/Dialog.js         the one modal shell (client)
  home/ businesses/ innovation/ news/ contact/ legal/   page sections
  NotFoundView.js ErrorView.js
  admin/ui/                Button, Form (Input/Select/Textarea/Field), Panel, Badge, Modal,
                           ConfirmDialog, Menu, PasswordInput, Toaster, toast
  admin/shell/AdminShell   sidebar (collapsible, cookie-persisted), mobile drawer, user menu
  admin/{forms,inquiries,users,account}/   client islands per screen
  admin/cms/               ContentForm (sections, save bar, Ctrl+S, unsaved guard), FieldRenderer,
                           Editors (Page/Item/SiteSection), CollectionList, CmsContext
  admin/media/             MediaPicker, MediaLibrary, Dropzone, uploadFile (XHR + progress)
  admin/seo/ admin/settings/   RouteSeoTable + SerpPreview, MailTest
lib/admin/                 useServerForm.js (RHF + action), format.js (admin dates)
proxy.js                   /admin gate: JWT check, redirect, sliding refresh, noindex headers
lib/                       format.js (dates, ordinals, labels, maps URLs), cn.js, images.js (remote hosts)
server/                    server-only code — never import from a Client Component
  env.js                   Zod-validated env, grouped by feature
  db/connect.js            cached Mongoose connection
  auth/password.js         argon2id hash/verify
  auth/jwt.js              sign/verify session JWT, cookie name/options (used by proxy too)
  auth/dal.js              getCurrentUser / requireUser / requireSuperAdmin / authorize
  auth/session.js          startSession / endSession (cookie writes, actions only)
  storage/uploads.js       sniff types, random names, path safety (swap for S3/R2 here)
  models/                  Mongoose models (+ index.js barrel)
  services/                business logic / data access
    _cache.js              TAGS + CONTENT_LIFE + toPlain()  ← Phase 4 updateTag() uses TAGS
    content.js             cached public reads (pages, businesses, news, leaders…)
    seo.js                 buildRootMetadata / buildPageMetadata
    inquiry.js mail.js rate-limit.js request.js
    auth.js users.js inquiry-admin.js dashboard.js audit.js   (Phase 3)
    cms.js cms-context.js media.js                            (Phase 4)
  validators/              Zod schemas — isomorphic: _shared.js, contact.js, auth.js, patterns.js
    cms/                   field DSL (fields.js) + specs: pages.js, collections.js, site.js
  actions/                 Server Actions: contact.js, auth.js, users.js, inquiries.js, cms.js, media.js, mail.js
scripts/seed/              seed script + data/ (content snapshot of warrick-frontend)
scripts/check-cms.js       spec ↔ model ↔ seed check (no DB needed)
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
| `media` | Media | upload library: storage key, url, type, size, dimensions, default alt | `key` |
| `ratelimits` | RateLimit | login / contact throttling (TTL) | `key` |

Every link/image field an admin can type is validated: links must be an
internal path, `#anchor`, `https://`, `mailto:` or `tel:` (no `javascript:`,
no `//host`); images must be a local path or `https://`. The patterns live in
`server/validators/patterns.js`, shared by the models and the dashboard forms.

---

## 6. Conventions

- **Server boundary:** files under `server/services`, `server/actions` start
  with `import "server-only"`. Models, `db/connect.js`, `env.js` and
  `auth/password.js` do **not**, because the seed script runs them in plain Node.
  `auth/jwt.js` doesn't either (proxy.js imports it). `server/validators/*` are
  the one part of `server/` Client Components may import: plain Zod only.
- **Admin pages:** first line of every page is `await requireUser()` or
  `await requireSuperAdmin()`. Every admin action starts with `authorize()`.
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
- **CMS fields:** change a model → change its spec in `server/validators/cms/` → `npm run check:cms`.
- **Before delivery:** `npx eslint .`, `npm run check:cms` and an esbuild syntax pass must be clean.

---

## 7. Environment & commands

Copy `.env.example` → `.env.local` and fill in `MONGODB_URI`, `SMTP_*`, `IP_HASH_SALT`, `JWT_SECRET`.

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run seed` | insert any missing content + the super_admin. **Safe to re-run**: never overwrites admin edits |
| `npm run seed:reset` | overwrite seeded docs with the original content (dashboard-created docs are kept) — not for production |
| `npm run seed -- --reset-admin` | reset the seeded super_admin's password from `.env.local` and unlock it |
| `npm run check:cms` | prove every editor covers its model and round-trips the seed content (no DB) |
| `npm run build` / `npm start` | production build / serve |

---

## 8. Phase plan

### Phase 1 — Foundation, models, seed ✅
- Dependencies, Node 24 (`engines`, `.nvmrc`), `"type": "module"`.
- `next.config.mjs`: security headers, image config, `poweredByHeader: false`.
- Design tokens ported to `app/globals.css`; fonts self-hosted via `next/font`.
- Zod env validation, cached DB connection, all models, idempotent seed.

### Phase 2 — Public site port ✅
- Root layout: Navbar + Footer (no TopBar), skip link, `generateMetadata` from `SeoSetting`.
- Pages: `/`, `/about`, `/businesses`, `/businesses/[slug]`, `/sustainability`, `/innovation`, `/news` (+ `/news/[slug]` via intercepting route so the modal UX stays), `/contact`, static `/privacy`, `/terms`.
- `not-found`, `error`, `global-error`, `loading`.
- Server Components by default; client islands only for hero Swiper, nav menu, dialogs, news filter, contact form.
- Service layer with `"use cache"` + `cacheTag` (enable `cacheComponents`).
- Contact: Server Action → Zod → rate limit → save Inquiry → Nodemailer (desk + acknowledgement) via `after()`; header-injection safe; honeypot.
- Add section anchors: `#leadership`, `#board`, `#governance`, `#reports`.
- Placeholder routes kept as a commented list in code.

### Phase 3 — Auth + admin shell ✅
- `/admin/login`, JWT session cookie, `proxy.js` optimistic redirect, DAL `verifySession()`.
- Login rate limit + account lockout; change password; log out everywhere.
- Users module (super_admin only): create, deactivate, reset password, role change; last-super_admin guard.
- Sidebar layout (collapsible, mobile drawer), dashboard overview, inquiries inbox.
- UI kit: shadcn/ui, react-hook-form, sonner.

### Phase 4 — CMS ✅
- Editors for every page document and collection (nested arrays with add/remove/reorder).
- SEO manager (global + per-route + per-item overrides) and Site settings (nav, footer, inquiry routing, SMTP test).
- Local uploads (type/size validation, random filenames, `/uploads` route), image picker.
- `updateTag()` on save, audit log.

### Phase 5 — Hardening & deploy
- `sitemap.js`, `robots.js`, JSON-LD (Organization, WebSite, BreadcrumbList, NewsArticle), dynamic OG images.
- Lighthouse ≥ 95, bundle analysis, `LazyMotion`, LCP preload; responsive QA at 360/768/1024/1440.
- CSP, final header review, dependency audit. CSP must allow `img-src https:` (SmartImage renders pasted remote images unoptimised) and the admin's `/uploads` thumbnails.
- VPS: Nginx serves `/uploads` directly (snippet below) and `client_max_body_size` ≥ UPLOAD_MAX_MB for `/api/admin/media`.
- Vercel deploy guide; create vercel.json

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

### Phase 3 — 2026-10-03
**Added:** `proxy.js`; `server/auth/{jwt,dal,session}.js`; `server/services/{auth,users,inquiry-admin,dashboard,audit}.js`; `server/actions/{auth,users,inquiries}.js`; `server/validators/{_shared,auth}.js`; `app/admin/**` (layout, admin.css, login, (panel): overview, inquiries + [id], users, account, loading, error, not-found); `components/admin/**`; `lib/admin/{useServerForm,format}.js`. Dependencies: `jose`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `radix-ui`.
**Changed:** `server/auth/password.js` (PASSWORD_MIN_LENGTH now re-exported from `validators/auth.js`), `server/validators/contact.js` (`fieldErrors` moved to `_shared.js`, re-exported).
**Verified (seeded DB, `next build` + `next start`, Playwright at 1440/1280/390 px):** build clean, public routes still static (○), all /admin routes partial-prerender; eslint + esbuild clean; no console errors. Login: client + server validation, wrong password, `?next=` return, `next=//evil.com` → /admin, tampered cookie → login + cookie cleared, `X-Robots-Tag`/`no-store` headers. Lockout: 5th wrong password locks, correct password refused while locked, Users shows "Locked", Unlock works. Roles: admin has no Users link, `/admin/users` → /admin, no Delete on inquiries. Deactivate → that user's open session is out on next click and login says "Incorrect email or password"; reactivate. Create user (policy errors, generator, duplicate email). Change password (wrong current, success keeps this session, other session logged out). Sign out everywhere. Inbox: tabs/counts, search (incl. `<script>` rendered escaped, regex chars), garbage query params, archive from row menu, open → marked read + sidebar badge drops, delete. Sidebar collapse persists across reload, tooltips; mobile drawer opens/closes on navigation; no horizontal overflow at 390 px.
**Not verified here:** tested against FerretDB (MongoDB-compatible) instead of real MongoDB — it lacks TTL/partial indexes and projections in findAndModify, which were shimmed for the test only; the code uses standard MongoDB features. Google Fonts swapped for local copies during the test build (sandbox has no access).

### Phase 4 — 2026-10-03
**Added:** `server/validators/cms/` (field DSL + specs for 7 pages, 7 collections, 5 settings sections, route SEO), `server/validators/patterns.js`, `server/services/{cms,cms-context,media}.js`, `server/actions/{cms,media,mail}.js`, `server/storage/uploads.js`, `server/models/Media.js`, `app/api/admin/media/route.js`, `app/uploads/[...path]/route.js`, `app/admin/(panel)/{pages,[collection],media,seo,settings,activity}/`, `components/admin/{cms,media,seo,settings}/`, `components/ui/SmartImage.js`, `lib/images.js`, `scripts/check-cms.js`. Dependency: `sharp` (was already installed by Next; now explicit).
**Changed:** `next.config.mjs` (remotePatterns from lib/images.js, `localPatterns`), six public components import `SmartImage` instead of `next/image` (import line only, no markup change), `server/models/{_shared,index}.js` (patterns moved to validators/patterns.js), `scripts/seed/index.js` (Media indexes), `server/services/{audit,mail}.js` (activity list, SMTP test), `lib/admin/{useServerForm,format}.js` (onInvalid + saved values, formatDate), `components/admin/shell/AdminShell.js` (Content / Site / Administration nav), every admin form gets `method="post"`.
**Verified:** `check:cms` 68 checks (every seed document round-trips through its editor and Mongoose with nothing lost; every model path has a field; unsafe links, data: images, bad slugs/phones, reserved keys, duplicate desks, template without %s are rejected); eslint 0; esbuild clean; `next build` 0 warnings, public routes still static. Browser tests (Playwright, `next start`, 1440 + 390 px) — 70+ checks: every admin screen renders; edit → save → public page updated on the next request (home hero, about facts, footer, header button, page `<title>`, business SEO override, website band off); validation (required, unsafe link, focus first error, error count, discard); two-tab conflict; list add/move/remove; create/reorder/hide/delete business; draft → publish article; duplicate slug; head office moves; office key rename follows into the contact page; uploads (403 without header, 401 without session, 403 cross-site, SVG disguised as PNG → 415, EXIF stripped, 4000px → 3000px, random names, traversal and unknown extensions → 404, nosniff/sandbox/immutable headers, next/image serves AVIF, query-string variants → 400); media in use can't be deleted; admin role has no Delete and no inquiry desks but can edit content; activity log summaries name the changed sections; no horizontal overflow at 390 px.
**Found and fixed while testing:** a login click before hydration submitted a native GET with the password in the URL (Phase 3 form) → `method="post"` on every admin form; a save that failed on a field from another settings section did nothing visible → section saves validate only their own paths, and unrenderable errors become a form message; activity summaries listed untouched sections (sub-document `_id`s) → ignored in the diff; `<fieldset>` min-content width overflowed phones → `min-w-0`.
**Not verified here:** real MongoDB (tested against an in-memory MongoDB-compatible server, which also mangles nested ObjectIds — standard MongoDB doesn't), Google Fonts (swapped for local copies during the test build only), real Unsplash images and SMTP delivery (no outbound network).

#### VPS: serving uploads with Nginx (Phase 5 deploy)
```nginx
client_max_body_size 10m;                     # ≥ UPLOAD_MAX_MB

location /uploads/ {
    alias /var/www/warrick-group/uploads/;    # = <project>/UPLOAD_DIR
    types { image/jpeg jpg; image/png png; image/webp webp; image/avif avif; image/gif gif; application/pdf pdf; }
    default_type application/octet-stream;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Content-Type-Options nosniff;
    add_header Content-Security-Policy "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox";
    location ~* \.pdf$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options nosniff;
        add_header Content-Security-Policy "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; object-src 'self'";
    }
}
```

### Phase 4 follow-up — 2026-10-03
Fixed after the first run on the developer machine: `querySrv ECONNREFUSED` on seed (optional `MONGODB_DNS_SERVERS`); dev-overlay "uncached data during prerendering" on dashboard pages (`instant = false` per page); "unique key" warning from FounderSection (key before spread, `itemKey` everywhere); scroll-behavior notice (`data-scroll-behavior`). Reproduced each in `next dev` and confirmed gone; build 0 warnings, eslint 0, check:cms 68/68.
Open (Phase 5): Next reports `/asma.jpeg` as the LCP image on some viewports; LCP preload/eager is part of the Phase 5 performance pass.
