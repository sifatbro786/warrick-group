import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The site's one text-link pattern: uppercase label on a hairline that turns
 * gold on hover, with an arrow that slides. Every "Explore Division",
 * "View All Press Releases" and "Read the Group Profile" is this component.
 *
 *   tone="light"  label royal, rule line, arrow gold-dark   (white grounds)
 *   tone="dark"   label white, rule gold/40, arrow gold     (royal grounds)
 *
 * `className` carries the call site's margin (mt-8, mt-12…), exactly as the
 * React markup did.
 */
export default function ArrowLink({ href, children, tone = "light", className, rule, ...rest }) {
    const dark = tone === "dark";

    return (
        <Link
            href={href}
            className={cn(
                "group inline-flex items-center gap-4 border-b pb-2 transition-colors duration-500 ease-premium hover:border-gold",
                rule ?? (dark ? "border-gold/40" : "border-line"),
                className,
            )}
            {...rest}
        >
            <span
                className={cn(
                    "text-[11px] font-semibold tracking-[0.2em] uppercase",
                    dark ? "text-white" : "text-royal",
                )}
            >
                {children}
            </span>
            <span
                aria-hidden="true"
                className={cn(
                    "transition-transform duration-500 ease-premium group-hover:translate-x-1.5",
                    dark ? "text-gold" : "text-gold-dark",
                )}
            >
                &rarr;
            </span>
        </Link>
    );
}
