import { Rise } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

/**
 * Eyebrow + h2 used at the top of most content sections. Must sit inside a
 * <Stagger>. `titleClass` carries the measure (max-w-[20ch]…), which varies
 * by section in the original design.
 */
export default function SectionHeading({ id, eyebrow, title, titleClass = "max-w-[20ch]", as = "h2" }) {
    return (
        <>
            {eyebrow ? (
                <Rise as="p" className="eyebrow text-gold-dark">
                    {eyebrow}
                </Rise>
            ) : null}
            {title ? (
                <Rise
                    as={as}
                    id={id}
                    className={cn(
                        "mt-6 text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.15] font-bold text-royal",
                        titleClass,
                    )}
                >
                    {title}
                </Rise>
            ) : null}
        </>
    );
}

/**
 * The two-column header: heading left (6 cols), intro bottom-aligned right
 * (5 cols from col 8). Used by roadmap, reports, focus, governance,
 * operations.
 */
export function SplitHeading({ id, eyebrow, title, intro, titleClass }) {
    return (
        <div className="grid gap-x-8 gap-y-10 lg:grid-cols-12 lg:gap-x-20">
            <div className="lg:col-span-6">
                <SectionHeading id={id} eyebrow={eyebrow} title={title} titleClass={titleClass} />
            </div>
            {intro ? (
                <Rise
                    as="p"
                    className="max-w-[54ch] self-end text-[15px] leading-[1.9] text-ink-muted lg:col-span-5 lg:col-start-8"
                >
                    {intro}
                </Rise>
            ) : null}
        </div>
    );
}
