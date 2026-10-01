import Link from "next/link";
import ArrowLink from "@/components/ui/ArrowLink";
import Plate from "@/components/ui/Plate";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { pad } from "@/lib/format";

/* ==========================================================================
   PortfolioSection — alternating editorial rows rather than a card grid, so
   the page changes rhythm before the three-across newsroom below.
   ========================================================================== */
export default function PortfolioSection({ heading = {}, items = [], itemCtaLabel }) {
    const rise = { y: 28, duration: 0.85 };

    return (
        <section aria-labelledby="portfolio-heading" className="border-t border-line bg-surface">
            <div className="mx-auto max-w-360 px-5 py-28 sm:px-6 lg:px-10">
                {/* ---------------- Header ---------------- */}
                <Stagger className="grid gap-x-8 gap-y-6 lg:grid-cols-12">
                    <Rise as="p" {...rise} className="eyebrow text-gold-dark lg:col-span-12">
                        {heading.eyebrow}
                    </Rise>

                    <Rise
                        as="h2"
                        {...rise}
                        id="portfolio-heading"
                        className="max-w-[18ch] text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.15] font-bold text-royal lg:col-span-7"
                    >
                        {heading.title}
                    </Rise>

                    {heading.intro ? (
                        <Rise
                            as="p"
                            {...rise}
                            className="max-w-[46ch] text-[15px] leading-[1.75] text-ink-muted lg:col-span-4 lg:col-start-9 lg:pt-2"
                        >
                            {heading.intro}
                        </Rise>
                    ) : null}
                </Stagger>

                {/* ---------------- Entity rows ---------------- */}
                <div className="mt-20 lg:mt-28">
                    {items.map((entity, index) => {
                        /* Sides alternate so the eye zig-zags down the page. */
                        const imageFirst = index % 2 === 0;

                        return (
                            <Stagger
                                as="article"
                                key={entity._id ?? entity.name}
                                stagger={0.12}
                                margin="-80px"
                                className="grid items-center gap-10 border-t border-line pt-12 pb-20 last:pb-0 lg:grid-cols-12 lg:gap-16 lg:pt-16 lg:pb-28"
                            >
                                {/* Plate */}
                                <Rise {...rise} className={`lg:col-span-7 ${imageFirst ? "" : "lg:order-2"}`}>
                                    <Link
                                        href={entity.path || "/businesses"}
                                        tabIndex={-1}
                                        aria-hidden="true"
                                        className="group block overflow-hidden"
                                    >
                                        <Plate
                                            image={entity.image}
                                            alt=""
                                            ratio="aspect-16/10"
                                            sizes="(min-width: 64rem) 58vw, 100vw"
                                            quality={70}
                                            imgClass="transition-transform duration-1000 ease-premium group-hover:scale-[1.03]"
                                        />
                                    </Link>
                                </Rise>

                                {/* Editorial column */}
                                <Rise {...rise} className={`lg:col-span-5 ${imageFirst ? "" : "lg:order-1"}`}>
                                    <p className="eyebrow text-ink-muted/70">{pad(index + 1)}</p>

                                    <h3 className="mt-6 text-[clamp(1.5rem,2vw,2rem)] leading-tight font-bold text-royal">
                                        {entity.name}
                                    </h3>

                                    <p className="eyebrow mt-4 text-gold-dark">{entity.sector}</p>

                                    <p className="mt-6 max-w-[48ch] text-[15px] leading-[1.8] text-ink-muted">
                                        {entity.summary}
                                    </p>

                                    {entity.path ? (
                                        <ArrowLink href={entity.path} className="mt-8">
                                            {itemCtaLabel}
                                        </ArrowLink>
                                    ) : null}
                                </Rise>
                            </Stagger>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
