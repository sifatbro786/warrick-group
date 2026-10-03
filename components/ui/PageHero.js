import { Rise, Stagger } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

/**
 * The royal-dark hero shared by About, Businesses, Sustainability and
 * Innovation: directional wash, eyebrow, h1, lead, and an optional facts
 * row passed as children. The entrance is pure CSS (`<Stagger css>`) so the
 * h1 paints in the first frame instead of after hydration (LCP). Rises in
 * `before` take order 0; pass `order` on children Rises to continue the
 * sequence (eyebrow, title, lead come next).
 *
 * @param {{ id: string, eyebrow?: string, title?: string, lead?: string,
 *           titleClass?: string, leadClass?: string,
 *           padding?: string, children?: React.ReactNode, before?: React.ReactNode }} props
 */
export default function PageHero({
    id,
    eyebrow,
    title,
    lead,
    titleClass = "max-w-[16ch]",
    leadClass = "max-w-[54ch]",
    eyebrowClass,
    padding = "py-24 lg:py-40",
    before,
    children,
}) {
    const offset = before ? 1 : 0;
    return (
        <section aria-labelledby={id} className="relative isolate overflow-hidden bg-royal-dark">
            {/* Directional wash. Light enters top-left where the title sits and
                falls away, so the band reads as a lit plane. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-linear-to-br from-royal-light/35 via-royal-deep/0 to-royal-dark" />
            </div>

            <Stagger css className={cn("mx-auto max-w-360 px-5 sm:px-6 lg:px-10", padding)}>
                {before}

                {eyebrow ? (
                    <Rise as="p" order={offset} className={cn("eyebrow text-gold", eyebrowClass)}>
                        {eyebrow}
                    </Rise>
                ) : null}

                <Rise
                    as="h1"
                    id={id}
                    order={offset + 1}
                    className={cn(
                        "mt-7 text-[clamp(2.125rem,4.4vw,4rem)] leading-[1.08] font-bold text-white",
                        titleClass,
                    )}
                >
                    {title}
                </Rise>

                {lead ? (
                    <Rise
                        as="p"
                        order={offset + 2}
                        className={cn(
                            "mt-9 text-[15px] leading-[1.9] text-white/55 lg:text-[16px]",
                            leadClass,
                        )}
                    >
                        {lead}
                    </Rise>
                ) : null}

                {children}
            </Stagger>
        </section>
    );
}
