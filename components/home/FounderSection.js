import ArrowLink from "@/components/ui/ArrowLink";
import Plate from "@/components/ui/Plate";
import { Rise, Stagger } from "@/components/motion/Reveal";

/* ==========================================================================
   FounderSection (React: AboutOverviewSection). The founder column carries
   the portrait, the statement and the attribution; the group column carries
   the argument. The quote sits beneath the plate rather than over it.
   ========================================================================== */
export default function FounderSection({ founder = {}, legalName }) {
    const rise = { y: 26, duration: 0.85 };

    return (
        <section aria-labelledby="founder-heading" className="border-t border-line bg-surface-soft">
            <Stagger stagger={0.09} className="mx-auto max-w-360 px-5 py-28 sm:px-6 lg:px-10 lg:py-36">
                {/* ---------------- Header ---------------- */}
                <Rise as="p" {...rise} className="eyebrow text-gold-dark">
                    {founder.eyebrow}
                </Rise>

                <Rise
                    as="h2"
                    {...rise}
                    id="founder-heading"
                    className="mt-7 max-w-[16ch] text-[clamp(1.875rem,2.8vw,3rem)] leading-[1.12] font-bold text-royal"
                >
                    {founder.title}
                </Rise>

                <div className="mt-20 grid gap-x-8 gap-y-20 lg:mt-28 lg:grid-cols-12 lg:items-start lg:gap-x-20">
                    {/* ================= Founder ================= */}
                    <div className="lg:col-span-6">
                        {founder.image?.url ? (
                            <Rise {...rise} className="relative overflow-hidden">
                                <Plate
                                    image={founder.image}
                                    alt={
                                        founder.image.alt ||
                                        `${founder.name}, ${founder.role} of ${legalName}`
                                    }
                                    ratio="aspect-4/5"
                                    sizes="(min-width: 64rem) 46vw, 100vw"
                                    quality={85}
                                    imgClass="saturate-[0.85]"
                                    veil="bg-royal-deep/8"
                                />
                            </Rise>
                        ) : null}

                        {/* One figure so the quote and its person are a single unit. */}
                        <Rise as="figure" {...rise} className="mt-12 border-t border-line pt-12">
                            {founder.quote ? (
                                <blockquote>
                                    <p className="max-w-[32ch] font-display text-[clamp(1.375rem,1.9vw,1.875rem)] leading-[1.38] font-medium text-balance text-royal">
                                        &ldquo;{founder.quote}&rdquo;
                                    </p>
                                </blockquote>
                            ) : null}

                            <figcaption className="mt-12">
                                <p className="font-display text-[clamp(1.5rem,2vw,2rem)] leading-none font-bold tracking-tight text-royal">
                                    {founder.name}
                                </p>
                                <p className="eyebrow mt-5 text-ink-muted">
                                    {founder.role}, {legalName}
                                </p>
                            </figcaption>
                        </Rise>
                    </div>

                    {/* ================= Group ================= */}
                    <div className="lg:col-span-6">
                        {(founder.paragraphs ?? []).map((paragraph, index) => (
                            <Rise
                                as="p"
                                {...rise}
                                key={paragraph.slice(0, 24)}
                                className={`max-w-[56ch] text-[15px] leading-[1.9] text-ink-muted ${index === 0 ? "" : "mt-7"}`}
                            >
                                {paragraph}
                            </Rise>
                        ))}

                        <dl className="mt-16">
                            {(founder.pillars ?? []).map((pillar) => (
                                <Rise
                                    {...rise}
                                    key={pillar._id ?? pillar.title}
                                    className="border-t border-line py-6"
                                >
                                    <dt className="text-[17px] font-bold text-royal">{pillar.title}</dt>
                                    <dd className="mt-2.5 max-w-[54ch] text-[14px] leading-relaxed text-ink-muted">
                                        {pillar.detail}
                                    </dd>
                                </Rise>
                            ))}
                        </dl>

                        {founder.cta?.path ? (
                            <Rise {...rise}>
                                <ArrowLink href={founder.cta.path} className="mt-12">
                                    {founder.cta.label}
                                </ArrowLink>
                            </Rise>
                        ) : null}
                    </div>
                </div>
            </Stagger>
        </section>
    );
}
