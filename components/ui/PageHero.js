import { Rise, Stagger } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

/**
 * The royal-dark hero shared by About, Businesses, Sustainability and
 * Innovation: directional wash, eyebrow, h1, lead, and an optional facts
 * row passed as children. Animates on mount (the React pages used
 * `animate="show"` for heroes except About, which revealed on scroll — the
 * difference is invisible above the fold).
 *
 * @param {{ id: string, eyebrow?: string, title?: string, lead?: string,
 *           titleClass?: string, leadClass?: string, onMount?: boolean,
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
    onMount = true,
    padding = "py-24 lg:py-40",
    before,
    children,
}) {
    return (
        <section aria-labelledby={id} className="relative isolate overflow-hidden bg-royal-dark">
            {/* Directional wash. Light enters top-left where the title sits and
                falls away, so the band reads as a lit plane. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-linear-to-br from-royal-light/35 via-royal-deep/0 to-royal-dark" />
            </div>

            <Stagger onMount={onMount} className={cn("mx-auto max-w-360 px-5 sm:px-6 lg:px-10", padding)}>
                {before}

                {eyebrow ? (
                    <Rise as="p" className={cn("eyebrow text-gold", eyebrowClass)}>
                        {eyebrow}
                    </Rise>
                ) : null}

                <Rise
                    as="h1"
                    id={id}
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
