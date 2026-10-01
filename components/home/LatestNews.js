import Link from "next/link";
import ArrowLink from "@/components/ui/ArrowLink";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { formatMonthYear, isoDay } from "@/lib/format";

/* ==========================================================================
   LatestNews (React: NewsSection). The latest published releases under
   hairline rules. Each card is one link stretched over the card with an
   ::after overlay, so screen readers announce a single destination.
   ========================================================================== */
export default function LatestNews({ heading = {}, cta, articles = [] }) {
    return (
        <section aria-labelledby="news-heading" className="border-t border-line bg-surface-soft">
            <div className="mx-auto max-w-360 px-5 py-28 sm:px-6 lg:px-10">
                {/* ---------------- Header ---------------- */}
                <Stagger className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
                    <div>
                        <Rise as="p" className="eyebrow text-gold-dark">
                            {heading.eyebrow}
                        </Rise>
                        <Rise
                            as="h2"
                            id="news-heading"
                            className="mt-6 max-w-[20ch] text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.15] font-bold text-royal"
                        >
                            {heading.title}
                        </Rise>
                    </div>

                    {cta?.path ? (
                        <Rise className="shrink-0">
                            <ArrowLink href={cta.path}>{cta.label}</ArrowLink>
                        </Rise>
                    ) : null}
                </Stagger>

                {/* ---------------- Releases ---------------- */}
                <Stagger
                    stagger={0.12}
                    margin="-80px"
                    className="mt-16 grid gap-x-8 gap-y-14 md:grid-cols-3 lg:mt-20 lg:gap-x-12"
                >
                    {articles.map((item) => (
                        <Rise
                            as="article"
                            key={item.slug}
                            className="group relative border-t border-line pt-8"
                        >
                            <div className="eyebrow flex items-center gap-5">
                                <time dateTime={isoDay(item.publishedAt)} className="text-ink-muted">
                                    {formatMonthYear(item.publishedAt)}
                                </time>
                                {item.category ? (
                                    <span className="text-gold-dark">{item.category.label}</span>
                                ) : null}
                            </div>

                            <h3 className="mt-6 text-[19px] leading-snug font-bold text-royal transition-colors duration-500 ease-premium group-hover:text-royal-light">
                                <Link
                                    href={`/news/${item.slug}`}
                                    className="after:absolute after:inset-0 after:content-['']"
                                >
                                    {item.title}
                                </Link>
                            </h3>

                            <p className="mt-5 text-[13px] text-ink-muted">{item.readTime} min read</p>

                            <span
                                aria-hidden="true"
                                className="mt-6 inline-block text-gold-dark opacity-0 transition-all duration-500 ease-premium group-hover:translate-x-1.5 group-hover:opacity-100"
                            >
                                &rarr;
                            </span>
                        </Rise>
                    ))}
                </Stagger>
            </div>
        </section>
    );
}
