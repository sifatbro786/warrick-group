import { Rise, Stagger } from "@/components/motion/Reveal";

/* Gutters around the hairline dividers. A cell only gets padding on the side
   where a divider sits, so row ends stay flush. nth-child rather than
   first:/last: because the column count changes (1 / 2 / 4). */
const CELL = [
    "group bg-surface py-10 sm:py-12",
    "sm:max-lg:[&:nth-child(even)]:pl-8",
    "sm:max-lg:[&:nth-child(odd)]:pr-8",
    "lg:[&:not(:nth-child(4n+1))]:pl-8",
    "lg:[&:not(:nth-child(4n))]:pr-8",
].join(" ");

/* ==========================================================================
   StatsSection — the counterweight to the hero. Structure from hairlines
   only: the dividers are the 1px gaps of a gap-px grid on a line ground.
   ========================================================================== */
export default function StatsSection({ heading = {}, items = [] }) {
    return (
        <section aria-labelledby="impact-heading" className="border-t border-line bg-surface">
            <div className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                {/* ---------------- Header ---------------- */}
                <Stagger delay={0.05} className="grid gap-x-8 gap-y-6 lg:grid-cols-12">
                    <Rise as="p" className="eyebrow text-gold-dark lg:col-span-12">
                        {heading.eyebrow}
                    </Rise>

                    <Rise
                        as="h2"
                        id="impact-heading"
                        className="max-w-[20ch] font-display text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.15] font-bold tracking-tight text-royal lg:col-span-7"
                    >
                        {heading.title}
                    </Rise>

                    {heading.intro ? (
                        <Rise
                            as="p"
                            className="max-w-[46ch] text-[15px] leading-[1.75] text-ink-muted lg:col-span-4 lg:col-start-9 lg:pt-2"
                        >
                            {heading.intro}
                        </Rise>
                    ) : null}
                </Stagger>

                {/* ---------------- Metric grid ---------------- */}
                <Stagger
                    as="dl"
                    delay={0.05}
                    margin="-80px"
                    className="mt-16 grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2 lg:mt-20 lg:grid-cols-4"
                >
                    {items.map((metric) => (
                        <Rise key={metric._id ?? metric.label} className={CELL}>
                            {/* The symbol carries the gold so the numeral keeps full contrast. */}
                            <dt className="flex items-start font-display text-[clamp(2.5rem,4.4vw,3.75rem)] leading-none font-bold tracking-tight text-ink">
                                {metric.value}
                                {metric.unit ? (
                                    <span className="ml-0.5 text-gold-dark">{metric.unit}</span>
                                ) : null}
                            </dt>

                            {/* Underline fills in from the left on hover. */}
                            <span
                                aria-hidden="true"
                                className="rule-gold mt-6 w-10 origin-left scale-x-100 transition-transform duration-700 ease-premium group-hover:scale-x-[3.2]"
                            />

                            <dd>
                                <p className="mt-6 text-[13px] font-semibold tracking-[0.14em] text-royal uppercase">
                                    {metric.label}
                                </p>
                                <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-ink-muted">
                                    {metric.detail}
                                </p>
                            </dd>
                        </Rise>
                    ))}
                </Stagger>
            </div>
        </section>
    );
}
