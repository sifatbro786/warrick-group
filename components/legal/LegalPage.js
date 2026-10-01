import { Rise, Stagger } from "@/components/motion/Reveal";

/**
 * Static legal document (Privacy, Terms). Not CMS-managed by design — see
 * PHASES.md §1. Layout follows the contact/news header (soft ground, split
 * heading) and the governance clause rows (title left, text right).
 *
 * @param {{ eyebrow: string, title: string, lead: string, updated: string,
 *           sections: Array<{ heading: string, paragraphs: string[] }> }} props
 */
export default function LegalPage({ eyebrow, title, lead, updated, sections }) {
    return (
        <>
            <section aria-labelledby="legal-heading" className="bg-surface-soft">
                <Stagger
                    onMount
                    className="mx-auto grid max-w-360 gap-x-8 gap-y-8 px-5 pt-20 pb-20 sm:px-6 lg:grid-cols-12 lg:gap-x-20 lg:px-10 lg:pt-32 lg:pb-28"
                >
                    <div className="lg:col-span-7">
                        <Rise as="p" className="eyebrow text-gold-dark">
                            {eyebrow}
                        </Rise>
                        <Rise
                            as="h1"
                            id="legal-heading"
                            className="mt-7 max-w-[18ch] text-[clamp(2rem,3.8vw,3.5rem)] leading-[1.1] font-bold text-royal"
                        >
                            {title}
                        </Rise>
                    </div>
                    <Rise className="self-end lg:col-span-4 lg:col-start-9">
                        <p className="max-w-[52ch] text-[15px] leading-[1.9] text-ink-muted">{lead}</p>
                        <p className="eyebrow mt-6 text-ink-muted/70">Last updated {updated}</p>
                    </Rise>
                </Stagger>
            </section>

            <section className="border-t border-line bg-surface">
                <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    {sections.map((section, index) => (
                        <Rise
                            as="section"
                            key={section.heading}
                            aria-labelledby={`legal-${index}`}
                            className="grid gap-x-8 gap-y-5 border-t border-line py-10 first:border-t-0 first:pt-0 lg:grid-cols-12 lg:gap-x-20 lg:py-12"
                        >
                            <h2
                                id={`legal-${index}`}
                                className="flex items-baseline gap-5 text-[17px] leading-snug font-bold text-royal lg:col-span-4"
                            >
                                <span className="eyebrow text-ink-muted/60">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span>{section.heading}</span>
                            </h2>
                            <div className="lg:col-span-7 lg:col-start-6">
                                {section.paragraphs.map((paragraph, i) => (
                                    <p
                                        key={paragraph.slice(0, 24)}
                                        className={`max-w-[68ch] text-[14px] leading-[1.9] text-ink-muted ${i ? "mt-5" : ""}`}
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </Rise>
                    ))}
                </Stagger>
            </section>
        </>
    );
}
