import { Suspense } from "react";
import ContactForm, { ContactFormWithParams } from "@/components/contact/ContactForm";
import GlobalMap from "@/components/contact/GlobalMap";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { mapsEmbedUrl, mapsLinkUrl } from "@/lib/format";
import { getPage, getSiteSettings, listOffices } from "@/server/services/content";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("contact");
}

/* ==========================================================================
   Contact — ported 1:1 from ContactPage.jsx.
   GROUND: Hero surface-soft → Split white → footer. The dark map frame is
   the only deep value on the page and sits well clear of the footer.
   ========================================================================== */
export default async function ContactPage() {
    const [page, site, offices] = await Promise.all([getPage("contact"), getSiteSettings(), listOffices()]);
    const { hero = {}, form = {}, locatedOffice = {}, map = {} } = page;

    /* Only key + label reach the browser; routing stays on the server. */
    const inquiryTypes = (site.inquiryTypes ?? []).map(({ key, label }) => ({ key, label }));

    const headOffice = offices.find((office) => office.isHeadquarters) ?? offices[0] ?? null;
    const hubs = offices.filter((office) => office !== headOffice);
    const mappedOffice = offices.find((office) => office.key === locatedOffice.officeKey) ?? headOffice;
    const legalName = site.brand.legalName;

    return (
        <>
            {/* =============================== HERO =============================== */}
            <section aria-labelledby="contact-heading" className="bg-surface-soft">
                <Stagger
                    onMount
                    className="mx-auto grid max-w-360 gap-x-8 gap-y-8 px-5 pt-20 pb-20 sm:px-6 lg:grid-cols-12 lg:gap-x-20 lg:px-10 lg:pt-32 lg:pb-28"
                >
                    <div className="lg:col-span-7">
                        <Rise as="p" className="eyebrow text-gold-dark">
                            {hero.eyebrow}
                        </Rise>
                        <Rise
                            as="h1"
                            id="contact-heading"
                            className="mt-7 max-w-[18ch] text-[clamp(2rem,3.8vw,3.5rem)] leading-[1.1] font-bold text-royal"
                        >
                            {hero.title}
                        </Rise>
                    </div>

                    {hero.lead ? (
                        <Rise
                            as="p"
                            className="max-w-[52ch] self-end text-[15px] leading-[1.9] text-ink-muted lg:col-span-4 lg:col-start-9"
                        >
                            {hero.lead}
                        </Rise>
                    ) : null}
                </Stagger>
            </section>

            {/* =============================== SPLIT =============================== */}
            <section className="border-t border-line bg-surface">
                <div className="mx-auto grid max-w-360 gap-x-8 gap-y-24 px-5 py-24 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-x-24 lg:px-10 lg:py-32">
                    {/* ---------------- LEFT — formal inquiry form ---------------- */}
                    <Stagger className="lg:col-span-6">
                        <Rise as="p" className="eyebrow text-gold-dark">
                            {form.eyebrow}
                        </Rise>
                        <Rise
                            as="h2"
                            className="mt-6 max-w-[18ch] text-[clamp(1.625rem,2.4vw,2.375rem)] leading-[1.15] font-bold text-royal"
                        >
                            {form.title}
                        </Rise>

                        {/* ?type= preselects a desk. Reading search params is
                            request-time data, so only this island waits for it;
                            the fallback is the same form with nothing selected. */}
                        <Suspense fallback={<ContactForm copy={form} inquiryTypes={inquiryTypes} />}>
                            <ContactFormWithParams copy={form} inquiryTypes={inquiryTypes} />
                        </Suspense>

                        {/* ---------------- Located office ----------------
                            Desaturated at rest, full colour on hover: a stock
                            Google tile fights the palette when left untreated. */}
                        {mappedOffice && locatedOffice.query ? (
                            <Rise className="mt-20 border-t border-line pt-12">
                                <p className="eyebrow text-ink-muted">{locatedOffice.eyebrow}</p>

                                <h3 className="mt-6 max-w-[24ch] text-[clamp(1.25rem,1.6vw,1.5rem)] leading-snug font-bold text-royal">
                                    {locatedOffice.title}
                                </h3>

                                <address className="mt-6 text-[14px] leading-[1.8] text-ink-muted not-italic">
                                    {mappedOffice.address.map((line) => (
                                        <span key={line} className="block">
                                            {line}
                                        </span>
                                    ))}
                                </address>

                                <div className="mt-10 aspect-4/3 w-full overflow-hidden border border-line sm:aspect-16/10">
                                    <iframe
                                        title={`Google map showing the ${mappedOffice.city} office of ${legalName}`}
                                        src={mapsEmbedUrl(locatedOffice)}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="h-full w-full border-0 grayscale-[0.3] saturate-[0.72] transition-[filter] duration-700 ease-premium hover:grayscale-0 hover:saturate-100"
                                    />
                                </div>

                                <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                    <p className="max-w-[42ch] text-[13px] leading-relaxed text-ink-muted">
                                        {locatedOffice.note}
                                    </p>
                                    <a
                                        href={mapsLinkUrl(locatedOffice)}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="group inline-flex shrink-0 items-center gap-4 border-b border-line pb-2 transition-colors duration-500 ease-premium hover:border-gold"
                                    >
                                        <span className="text-[11px] font-semibold tracking-[0.2em] text-royal uppercase">
                                            {locatedOffice.linkLabel}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className="text-gold-dark transition-transform duration-500 ease-premium group-hover:translate-x-1.5"
                                        >
                                            &rarr;
                                        </span>
                                    </a>
                                </div>
                            </Rise>
                        ) : null}
                    </Stagger>

                    {/* ---------------- RIGHT — offices and footprint ---------------- */}
                    <Stagger className="lg:col-span-5 lg:col-start-8">
                        {headOffice ? (
                            <Rise>
                                <p className="eyebrow text-gold-dark">{headOffice.role}</p>
                                <h2 className="mt-6 font-display text-[clamp(1.5rem,2vw,2rem)] leading-none font-bold tracking-tight text-royal">
                                    {headOffice.city}
                                </h2>
                                <address className="mt-8 text-[15px] leading-[1.9] text-ink-muted not-italic">
                                    {headOffice.address.map((line) => (
                                        <span key={line} className="block">
                                            {line}
                                        </span>
                                    ))}
                                </address>
                                <div className="mt-8 flex flex-col gap-3">
                                    {headOffice.phone ? (
                                        <a
                                            href={`tel:${headOffice.phone}`}
                                            className="w-fit border-b border-line pb-1 text-[15px] text-royal transition-colors duration-500 ease-premium hover:border-gold"
                                        >
                                            {headOffice.phoneDisplay || headOffice.phone}
                                        </a>
                                    ) : null}
                                    {headOffice.email ? (
                                        <a
                                            href={`mailto:${headOffice.email}`}
                                            className="w-fit border-b border-line pb-1 text-[15px] text-royal transition-colors duration-500 ease-premium hover:border-gold"
                                        >
                                            {headOffice.email}
                                        </a>
                                    ) : null}
                                </div>
                            </Rise>
                        ) : null}

                        {hubs.length ? (
                            <Rise className="mt-20">
                                <p className="eyebrow text-ink-muted">{page.hubsEyebrow}</p>
                                <dl className="mt-10">
                                    {hubs.map((office) => (
                                        <div key={office.key} className="border-t border-line py-8">
                                            <dt className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                                                <span className="text-[17px] font-bold text-royal">{office.city}</span>
                                                <span className="eyebrow text-gold-dark">{office.role}</span>
                                            </dt>
                                            <dd className="mt-4">
                                                <address className="text-[14px] leading-[1.8] text-ink-muted not-italic">
                                                    {office.address.map((line) => (
                                                        <span key={line} className="block">
                                                            {line}
                                                        </span>
                                                    ))}
                                                </address>
                                                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                                                    {office.phone ? (
                                                        <a
                                                            href={`tel:${office.phone}`}
                                                            className="text-[13px] text-royal transition-colors duration-500 ease-premium hover:text-gold-dark"
                                                        >
                                                            {office.phoneDisplay || office.phone}
                                                        </a>
                                                    ) : null}
                                                    {office.email ? (
                                                        <a
                                                            href={`mailto:${office.email}`}
                                                            className="text-[13px] text-royal transition-colors duration-500 ease-premium hover:text-gold-dark"
                                                        >
                                                            {office.email}
                                                        </a>
                                                    ) : null}
                                                </div>
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </Rise>
                        ) : null}

                        {offices.length ? (
                            <Rise className="mt-20 border-t border-line pt-12">
                                <p className="eyebrow text-ink-muted">{map.heading?.eyebrow}</p>
                                <h3 className="mt-6 max-w-[20ch] text-[clamp(1.25rem,1.6vw,1.5rem)] leading-snug font-bold text-royal">
                                    {map.heading?.title}
                                </h3>
                                <div className="mt-10">
                                    <GlobalMap locations={offices} originKey={headOffice?.key} />
                                </div>
                                {map.caption ? (
                                    <p className="mt-6 max-w-[46ch] text-[13px] leading-relaxed text-ink-muted">
                                        {map.caption}
                                    </p>
                                ) : null}
                            </Rise>
                        ) : null}
                    </Stagger>
                </div>
            </section>
        </>
    );
}
