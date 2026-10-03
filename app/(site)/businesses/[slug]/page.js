import Link from "next/link";
import { notFound } from "next/navigation";
import ExternalSiteLink from "@/components/businesses/ExternalSiteLink";
import PageHero from "@/components/ui/PageHero";
import Plate from "@/components/ui/Plate";
import SectionHeading, { SplitHeading } from "@/components/ui/SectionHeading";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { pad, itemKey } from "@/lib/format";
import { getBusinessBySlug, getPage, listBusinesses } from "@/server/services/content";
import { buildPageMetadata, getRouteSeo } from "@/server/services/seo";
import { breadcrumb, companyPage } from "@/server/services/structured-data";
import JsonLd from "@/components/seo/JsonLd";

/* Cache Components needs at least one sample param at build. Every published
   company is prerendered; one added later renders on first visit and is then
   cached like the rest. The placeholder only exists so an empty collection
   does not fail the build (it resolves to the 404). */
export async function generateStaticParams() {
    const businesses = await listBusinesses();
    return businesses.length ? businesses.map(({ slug }) => ({ slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const entity = await getBusinessBySlug(slug);
    if (!entity) return { title: "Company Not Found" };

    return buildPageMetadata("businesses", {
        path: `/businesses/${entity.slug}`,
        title: entity.seo?.title || `${entity.name} — ${entity.sector}`,
        description: entity.seo?.description || entity.summary,
        image: entity.seo?.ogImage || entity.coverImage?.url,
        noindex: entity.seo?.noindex,
    });
}

/* ==========================================================================
   Business detail — ported 1:1 from BusinessDetail.jsx. One template, every
   company; `website` and `detail.operations` are nullable and the bands they
   drive are skipped rather than printed empty.

   GROUND — Hero royal-dark → Narrative white → Capabilities soft →
   Operations white (optional) → Elsewhere alternates off the band above.
   ========================================================================== */
export default async function BusinessDetailPage({ params }) {
    const { slug } = await params;
    const [entity, all, page, section] = await Promise.all([
        getBusinessBySlug(slug),
        listBusinesses(),
        getPage("businesses"),
        getRouteSeo("businesses"),
    ]);
    if (!entity) notFound();

    const copy = page.detail ?? {};
    const { lead, narrative = [], metrics = [], capabilities = [], operations } = entity.detail ?? {};
    const siblings = all.filter((other) => other.slug !== entity.slug);
    const elsewhereGround = operations ? "bg-surface-soft" : "bg-surface";

    return (
        <>
            <JsonLd
                data={[
                    companyPage(entity),
                    breadcrumb([
                        { name: "Home", path: "/" },
                        { name: section?.label || "Our Businesses", path: "/businesses" },
                        { name: entity.name, path: `/businesses/${entity.slug}` },
                    ]),
                ]}
            />
            {/* =============================== HERO =============================== */}
            <PageHero
                id="entity-heading"
                eyebrow={entity.sector}
                eyebrowClass="mt-14"
                title={entity.name}
                lead={lead}
                leadClass="max-w-[56ch]"
                padding="py-20 lg:py-32"
                before={
                    /* Return path for readers arriving from search or a release. */
                    <Rise>
                        <Link
                            href="/businesses"
                            className="group inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-white/45 uppercase transition-colors duration-500 ease-premium hover:text-white"
                        >
                            <span
                                aria-hidden="true"
                                className="text-gold transition-transform duration-500 ease-premium group-hover:-translate-x-1.5"
                            >
                                &larr;
                            </span>
                            {copy.backLabel}
                        </Link>
                    </Rise>
                }
            >
                {entity.website ? (
                    <Rise order={4} className="mt-12">
                        <ExternalSiteLink website={entity.website} entityName={entity.name} tone="dark" />
                    </Rise>
                ) : null}

                <Rise as="dl" order={entity.website ? 5 : 4} className="mt-20 grid grid-cols-2 gap-x-8 gap-y-10 lg:mt-24 lg:grid-cols-4 lg:gap-x-12">
                    <div className="border-t border-white/12 pt-6">
                        <dt className="eyebrow text-white/45">Established</dt>
                        <dd className="mt-4 font-display text-[clamp(1.25rem,1.8vw,1.75rem)] leading-none font-bold tracking-tight text-white tabular-nums">
                            {entity.established}
                        </dd>
                    </div>
                    <div className="border-t border-white/12 pt-6">
                        <dt className="eyebrow text-white/45">Headquarters</dt>
                        <dd className="mt-4 text-[15px] leading-snug font-semibold text-white">{entity.headquarters}</dd>
                    </div>
                    <div className="border-t border-white/12 pt-6">
                        <dt className="eyebrow text-white/45">People</dt>
                        <dd className="mt-4 font-display text-[clamp(1.25rem,1.8vw,1.75rem)] leading-none font-bold tracking-tight text-white tabular-nums">
                            {entity.headcount}
                        </dd>
                    </div>
                    <div className="border-t border-white/12 pt-6">
                        <dt className="eyebrow text-white/45">Ownership</dt>
                        <dd className="mt-4 text-[15px] leading-snug font-semibold text-white">{entity.ownership}</dd>
                    </div>
                </Rise>
            </PageHero>

            {/* ======================= NARRATIVE AND READINGS ======================= */}
            <section aria-labelledby="profile-heading" className="border-t border-line bg-surface">
                <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    <Rise as="figure" className="relative overflow-hidden">
                        <Plate
                            image={entity.coverImage}
                            alt=""
                            ratio="aspect-16/9 lg:aspect-21/9"
                            sizes="100vw"
                            quality={70}
                            imgClass="saturate-[0.82]"
                            veil="bg-royal-deep/10"
                        />
                    </Rise>

                    <div className="mt-20 grid gap-x-8 gap-y-16 lg:mt-24 lg:grid-cols-12 lg:items-start lg:gap-x-20">
                        <div className="lg:col-span-6">
                            <SectionHeading
                                id="profile-heading"
                                eyebrow={copy.companyEyebrow}
                                title={entity.tagline}
                                titleClass="max-w-[22ch]"
                            />

                            {narrative.map((paragraph, index) => (
                                <Rise
                                    as="p"
                                    key={paragraph.slice(0, 24)}
                                    className={`max-w-[58ch] text-[15px] leading-[1.9] text-ink-muted ${index === 0 ? "mt-12" : "mt-7"}`}
                                >
                                    {paragraph}
                                </Rise>
                            ))}
                        </div>

                        {/* Four related measurements of one business, stacked. */}
                        <dl className="lg:col-span-5 lg:col-start-8">
                            {metrics.map((metric, index) => (
                                <Rise key={itemKey(metric, index)} className="border-t border-line py-8 last:pb-0">
                                    <dt className="eyebrow text-ink-muted">{metric.label}</dt>
                                    <dd>
                                        <span className="mt-4 block font-display text-[clamp(1.75rem,2.4vw,2.375rem)] leading-none font-bold tracking-tight text-royal tabular-nums">
                                            {metric.value}
                                            {metric.unit ? <span className="text-gold-dark">{metric.unit}</span> : null}
                                        </span>
                                        <span className="mt-4 block max-w-[40ch] text-[14px] leading-relaxed text-ink-muted">
                                            {metric.detail}
                                        </span>
                                    </dd>
                                </Rise>
                            ))}
                        </dl>
                    </div>
                </Stagger>
            </section>

            {/* ============================ CAPABILITIES ============================ */}
            {capabilities.length ? (
                <section aria-labelledby="capabilities-heading" className="border-t border-line bg-surface-soft">
                    <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                        <SectionHeading
                            id="capabilities-heading"
                            eyebrow={copy.capabilities?.eyebrow}
                            title={copy.capabilities?.title}
                            titleClass="max-w-[22ch]"
                        />

                        <dl className="mt-20 lg:mt-24">
                            {capabilities.map((capability, index) => (
                                <Rise
                                    key={itemKey(capability, index)}
                                    className="grid gap-x-8 gap-y-4 border-t border-line py-9 lg:grid-cols-12 lg:gap-x-20 lg:py-11"
                                >
                                    <dt className="flex items-baseline gap-5 lg:col-span-4">
                                        <span className="eyebrow text-ink-muted/60">{pad(index + 1)}</span>
                                        <span className="text-[18px] leading-snug font-bold text-royal">
                                            {capability.title}
                                        </span>
                                    </dt>
                                    <dd className="max-w-[64ch] text-[14px] leading-[1.85] text-ink-muted lg:col-span-7 lg:col-start-6">
                                        {capability.detail}
                                    </dd>
                                </Rise>
                            ))}
                        </dl>
                    </Stagger>
                </section>
            ) : null}

            {/* ============================= OPERATIONS ============================= */}
            {operations ? (
                <section aria-labelledby="operations-heading" className="border-t border-line bg-surface">
                    <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                        <SplitHeading
                            id="operations-heading"
                            eyebrow={operations.eyebrow}
                            title={operations.title}
                            intro={operations.intro}
                        />

                        {/* The sequence is the content, so it is an ordered list. */}
                        <ol className="mt-20 lg:mt-24">
                            {(operations.steps ?? []).map((step, index) => (
                                <Rise
                                    as="li"
                                    key={itemKey(step, index)}
                                    className="grid gap-x-8 gap-y-4 border-t border-line py-10 lg:grid-cols-12 lg:gap-x-20 lg:py-12"
                                >
                                    <p className="font-display text-[clamp(1.75rem,2.4vw,2.375rem)] leading-none font-bold tracking-tight text-ink-muted/35 tabular-nums lg:col-span-2">
                                        {pad(index + 1)}
                                    </p>
                                    <h3 className="max-w-[22ch] self-baseline text-[18px] leading-snug font-bold text-royal lg:col-span-4">
                                        {step.title}
                                    </h3>
                                    <p className="max-w-[58ch] text-[14px] leading-[1.85] text-ink-muted lg:col-span-5 lg:col-start-8">
                                        {step.detail}
                                    </p>
                                </Rise>
                            ))}
                        </ol>
                    </Stagger>
                </section>
            ) : null}

            {/* ======================== ELSEWHERE IN THE GROUP ======================== */}
            {siblings.length ? (
                <section aria-labelledby="elsewhere-heading" className={`border-t border-line ${elsewhereGround}`}>
                    <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                        <div className="grid gap-x-8 gap-y-10 lg:grid-cols-12 lg:items-end lg:gap-x-20">
                            <div className="lg:col-span-7">
                                <SectionHeading
                                    id="elsewhere-heading"
                                    eyebrow={copy.elsewhere?.eyebrow}
                                    title={copy.elsewhere?.title}
                                />
                            </div>

                            {entity.website?.status === "live" ? (
                                <Rise className="lg:col-span-4 lg:col-start-9">
                                    <p className="max-w-[36ch] text-[14px] leading-relaxed text-ink-muted">
                                        Buying from {entity.name} rather than reading about it? The trading site is at{" "}
                                        {entity.website.display}.
                                    </p>
                                    <div className="mt-6">
                                        <ExternalSiteLink website={entity.website} entityName={entity.name} />
                                    </div>
                                </Rise>
                            ) : null}
                        </div>

                        <div className="mt-16 grid gap-x-8 gap-y-12 lg:mt-20 lg:grid-cols-2 lg:gap-x-20">
                            {siblings.map((sibling) => (
                                <Rise as="article" key={sibling.slug} className="group relative border-t border-line pt-8">
                                    <p className="eyebrow text-gold-dark">{sibling.sector}</p>
                                    <h3 className="mt-5 font-display text-[clamp(1.375rem,1.8vw,1.75rem)] leading-none font-bold tracking-tight text-royal transition-colors duration-500 ease-premium group-hover:text-royal-light">
                                        <Link
                                            href={`/businesses/${sibling.slug}`}
                                            className="after:absolute after:inset-0 after:content-['']"
                                        >
                                            {sibling.name}
                                        </Link>
                                    </h3>
                                    <p className="mt-5 max-w-[48ch] text-[14px] leading-[1.8] text-ink-muted">
                                        {sibling.tagline}
                                    </p>
                                    <span
                                        aria-hidden="true"
                                        className="mt-6 inline-block text-gold-dark opacity-0 transition-all duration-500 ease-premium group-hover:translate-x-1.5 group-hover:opacity-100"
                                    >
                                        &rarr;
                                    </span>
                                </Rise>
                            ))}
                        </div>
                    </Stagger>
                </section>
            ) : null}
        </>
    );
}
