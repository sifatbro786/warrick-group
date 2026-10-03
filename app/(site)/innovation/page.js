import ArrowLink from "@/components/ui/ArrowLink";
import PageHero from "@/components/ui/PageHero";
import SectionHeading, { SplitHeading } from "@/components/ui/SectionHeading";
import VentureGrid from "@/components/innovation/VentureGrid";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { pad, itemKey } from "@/lib/format";
import { getPage, listVentures } from "@/server/services/content";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("innovation");
}

/* ==========================================================================
   Innovation — ported 1:1 from InnovationPage.jsx.
   GROUND: Hero royal-dark → Focus white → Ventures soft → Funding white.
   ========================================================================== */
export default async function InnovationPage() {
    const [page, ventures] = await Promise.all([getPage("innovation"), listVentures()]);
    const { hero = {}, focus = {}, capitalNote = {} } = page;

    return (
        <>
            <PageHero id="innovation-heading" eyebrow={hero.eyebrow} title={hero.title} lead={hero.lead} />

            {/* ============================ FOCUS AREAS ============================ */}
            <section aria-labelledby="focus-heading" className="border-t border-line bg-surface">
                <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    <SplitHeading
                        id="focus-heading"
                        eyebrow={focus.heading?.eyebrow}
                        title={focus.heading?.title}
                        intro={focus.heading?.intro}
                        titleClass="max-w-[24ch]"
                    />

                    {/* Disciplines read as a sentence fragment, not a row of tags. */}
                    <div className="mt-20 lg:mt-24">
                        {(focus.areas ?? []).map((area, index) => (
                            <Rise
                                as="article"
                                key={itemKey(area, index)}
                                className="grid gap-x-8 gap-y-6 border-t border-line py-10 lg:grid-cols-12 lg:gap-x-20 lg:py-12"
                            >
                                <div className="lg:col-span-4">
                                    <p className="eyebrow text-ink-muted/60">{pad(index + 1)}</p>
                                    <h3 className="mt-5 max-w-[18ch] text-[19px] leading-snug font-bold text-royal">
                                        {area.title}
                                    </h3>
                                    <p className="eyebrow mt-5 text-gold-dark">{area.leadEntity}</p>
                                </div>

                                <div className="lg:col-span-4">
                                    <p className="max-w-[36ch] font-display text-[clamp(1.0625rem,1.3vw,1.25rem)] leading-[1.5] font-medium text-balance text-royal">
                                        {area.statement}
                                    </p>
                                </div>

                                <div className="lg:col-span-3 lg:col-start-10">
                                    <p className="max-w-[46ch] text-[14px] leading-[1.85] text-ink-muted">{area.detail}</p>
                                    {area.disciplines?.length ? (
                                        <p className="mt-6 text-[13px] leading-relaxed text-ink-muted/75">
                                            {area.disciplines.join(" · ")}
                                        </p>
                                    ) : null}
                                </div>
                            </Rise>
                        ))}
                    </div>
                </Stagger>
            </section>

            {/* ============================== VENTURES ============================== */}
            <section aria-labelledby="ventures-heading" className="border-t border-line bg-surface-soft">
                <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    <SectionHeading
                        id="ventures-heading"
                        eyebrow={page.ventures?.heading?.eyebrow}
                        title={page.ventures?.heading?.title}
                        titleClass="max-w-[22ch]"
                    />
                    <VentureGrid ventures={ventures} />
                </Stagger>
            </section>

            {/* ============================== FUNDING ============================== */}
            <section aria-labelledby="funding-heading" className="border-t border-line bg-surface">
                <Stagger className="mx-auto grid max-w-360 gap-x-8 gap-y-10 px-5 py-24 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-x-20 lg:px-10 lg:py-32">
                    <div className="lg:col-span-6">
                        <SectionHeading
                            id="funding-heading"
                            eyebrow={capitalNote.heading?.eyebrow}
                            title={capitalNote.heading?.title}
                        />
                    </div>

                    <div className="lg:col-span-5 lg:col-start-8">
                        {capitalNote.body ? (
                            <Rise
                                as="p"
                                className="max-w-[54ch] border-t border-line pt-10 text-[15px] leading-[1.9] text-ink-muted"
                            >
                                {capitalNote.body}
                            </Rise>
                        ) : null}

                        {capitalNote.cta?.path ? (
                            <Rise>
                                <ArrowLink href={capitalNote.cta.path} className="mt-12">
                                    {capitalNote.cta.label}
                                </ArrowLink>
                            </Rise>
                        ) : null}
                    </div>
                </Stagger>
            </section>
        </>
    );
}
