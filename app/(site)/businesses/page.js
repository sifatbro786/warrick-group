import ArrowLink from "@/components/ui/ArrowLink";
import PageHero from "@/components/ui/PageHero";
import Plate from "@/components/ui/Plate";
import SectionHeading from "@/components/ui/SectionHeading";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { pad, itemKey } from "@/lib/format";
import { getPage, listBusinesses } from "@/server/services/content";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("businesses");
}

/* ==========================================================================
   Businesses index — ported 1:1 from BusinessesPage.jsx.
   GROUND: Hero royal-dark → Portfolio white → Structure soft → footer.
   Rows alternate the plate left/right by position, so the rhythm survives a
   company being added or reordered from the dashboard.
   ========================================================================== */
export default async function BusinessesPage() {
    const [page, businesses] = await Promise.all([getPage("businesses"), listBusinesses()]);
    const { hero = {}, outro = {} } = page;

    return (
        <>
            <PageHero id="businesses-heading" eyebrow={hero.eyebrow} title={hero.title} lead={hero.lead} />

            {/* ============================ PORTFOLIO ============================ */}
            <section aria-label="Group companies" className="border-t border-line bg-surface">
                <div className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    {businesses.map((entity, entityIndex) => {
                        const plateOnRight = entityIndex % 2 === 1;

                        return (
                            <Stagger
                                as="article"
                                key={entity.slug}
                                aria-labelledby={`entity-${entity.slug}`}
                                className="grid gap-x-8 gap-y-10 border-t border-line py-16 first:border-t-0 first:pt-0 lg:grid-cols-12 lg:items-center lg:gap-x-20 lg:py-24"
                            >
                                {/* ---------------- Plate ---------------- */}
                                <Rise
                                    className={`relative overflow-hidden lg:col-span-6 ${
                                        plateOnRight ? "lg:order-2 lg:col-start-7" : ""
                                    }`}
                                >
                                    <Plate
                                        image={entity.coverImage}
                                        alt=""
                                        ratio="aspect-3/2"
                                        sizes="(min-width: 64rem) 48vw, 100vw"
                                        quality={70}
                                        imgClass="saturate-[0.82]"
                                        veil="bg-royal-deep/10"
                                    />
                                </Rise>

                                {/* ---------------- Editorial ---------------- */}
                                <div
                                    className={`lg:col-span-5 ${
                                        plateOnRight ? "lg:order-1 lg:col-start-1" : "lg:col-start-8"
                                    }`}
                                >
                                    <Rise className="flex items-baseline gap-5">
                                        <span className="eyebrow text-ink-muted/60">{pad(entityIndex + 1)}</span>
                                        <span className="eyebrow text-gold-dark">{entity.sector}</span>
                                    </Rise>

                                    <Rise
                                        as="h2"
                                        id={`entity-${entity.slug}`}
                                        className="mt-6 font-display text-[clamp(1.75rem,2.6vw,2.5rem)] leading-none font-bold tracking-tight text-royal"
                                    >
                                        {entity.name}
                                    </Rise>

                                    {entity.tagline ? (
                                        <Rise
                                            as="p"
                                            className="mt-6 max-w-[32ch] font-display text-[clamp(1.0625rem,1.3vw,1.25rem)] leading-[1.5] font-medium text-balance text-royal"
                                        >
                                            {entity.tagline}
                                        </Rise>
                                    ) : null}

                                    <Rise as="p" className="mt-7 max-w-[52ch] text-[15px] leading-[1.9] text-ink-muted">
                                        {entity.summary}
                                    </Rise>

                                    <Rise as="dl" className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
                                        <div className="border-t border-line pt-4">
                                            <dt className="eyebrow text-ink-muted/70">Established</dt>
                                            <dd className="mt-2.5 text-[15px] font-semibold text-royal tabular-nums">
                                                {entity.established}
                                            </dd>
                                        </div>
                                        <div className="border-t border-line pt-4">
                                            <dt className="eyebrow text-ink-muted/70">Base</dt>
                                            <dd className="mt-2.5 text-[15px] font-semibold text-royal">
                                                {entity.headquarters?.split(",")[0]}
                                            </dd>
                                        </div>
                                        <div className="border-t border-line pt-4">
                                            <dt className="eyebrow text-ink-muted/70">People</dt>
                                            <dd className="mt-2.5 text-[15px] font-semibold text-royal tabular-nums">
                                                {entity.headcount}
                                            </dd>
                                        </div>
                                    </Rise>

                                    <Rise className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4">
                                        <ArrowLink href={`/businesses/${entity.slug}`}>Inside {entity.name}</ArrowLink>

                                        {/* The external site, surfaced on the index too. */}
                                        {entity.website?.status === "live" ? (
                                            <a
                                                href={entity.website.url}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="group inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase transition-colors duration-500 ease-premium hover:text-royal"
                                            >
                                                {entity.website.display}
                                                <span
                                                    aria-hidden="true"
                                                    className="text-gold-dark transition-transform duration-500 ease-premium group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                                >
                                                    &#8599;
                                                </span>
                                            </a>
                                        ) : null}
                                    </Rise>
                                </div>
                            </Stagger>
                        );
                    })}
                </div>
            </section>

            {/* ============================ STRUCTURE ============================ */}
            <section aria-labelledby="structure-heading" className="border-t border-line bg-surface-soft">
                <Stagger className="mx-auto grid max-w-360 gap-x-8 gap-y-10 px-5 py-24 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-x-20 lg:px-10 lg:py-32">
                    <div className="lg:col-span-6">
                        <SectionHeading
                            id="structure-heading"
                            eyebrow={outro.heading?.eyebrow}
                            title={outro.heading?.title}
                        />
                    </div>

                    <div className="lg:col-span-5 lg:col-start-8">
                        {outro.body ? (
                            <Rise
                                as="p"
                                className="max-w-[54ch] border-t border-line pt-10 text-[15px] leading-[1.9] text-ink-muted"
                            >
                                {outro.body}
                            </Rise>
                        ) : null}

                        {outro.links?.length ? (
                            <Rise className="mt-12 flex flex-col gap-6 sm:flex-row sm:gap-12">
                                {outro.links.map((link, index) => (
                                    <ArrowLink key={itemKey(link, index)} href={link.path} className="w-fit">
                                        {link.label}
                                    </ArrowLink>
                                ))}
                            </Rise>
                        ) : null}
                    </div>
                </Stagger>
            </section>
        </>
    );
}
