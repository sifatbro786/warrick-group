import Link from "next/link";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { getSiteSettings } from "@/server/services/content";

/* ==========================================================================
   NotFoundView — ported 1:1 from NotFoundPage.jsx. Static copy by design
   (PHASES.md: 404 is not CMS-managed); the suggested destinations are
   derived from the live navigation so they never drift from the header.

   Unlike the React SPA this now returns a real 404 status.
   ========================================================================== */
const DEFAULT_COPY = {
    eyebrow: "Error 404",
    title: "Page Not Found",
    description:
        "The address you followed does not resolve to anything on this site. It may have moved, the link may be out of date, or there may be a typo in the URL.",
};

export default async function NotFoundView({
    eyebrow = DEFAULT_COPY.eyebrow,
    title = DEFAULT_COPY.title,
    description = DEFAULT_COPY.description,
}) {
    const { navigation } = await getSiteSettings();
    const destinations = [
        { label: "Home", path: "/" },
        ...(navigation?.main ?? []).map(({ label, path }) => ({ label, path })),
        ...(navigation?.cta?.path ? [{ label: navigation.cta.label, path: navigation.cta.path }] : []),
    ];

    return (
        <section aria-labelledby="not-found-heading" className="bg-surface-soft">
            <Stagger onMount className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-40">
                <div className="grid gap-x-8 gap-y-14 lg:grid-cols-12 lg:gap-x-20">
                    {/* ---------------- Statement ---------------- */}
                    <div className="lg:col-span-6">
                        <Rise as="p" className="eyebrow text-gold-dark">
                            {eyebrow}
                        </Rise>

                        {/* Display scale, near-hairline value: the loudest and least
                            useful thing on the page carries no contrast. */}
                        <Rise
                            as="p"
                            aria-hidden="true"
                            className="mt-10 font-display text-[clamp(5rem,14vw,11rem)] leading-[0.82] font-bold tracking-tighter text-ink-muted/15 select-none"
                        >
                            404
                        </Rise>

                        <Rise
                            as="h1"
                            id="not-found-heading"
                            className="mt-10 max-w-[16ch] text-[clamp(1.875rem,3.4vw,3rem)] leading-[1.1] font-bold text-royal"
                        >
                            {title}
                        </Rise>

                        <Rise as="p" className="mt-8 max-w-[50ch] text-[15px] leading-[1.9] text-ink-muted">
                            {description}
                        </Rise>

                        <Rise>
                            <Link
                                href="/"
                                className="group mt-12 inline-flex items-center gap-4 border-b border-line pb-2 transition-colors duration-500 ease-premium hover:border-gold"
                            >
                                <span
                                    aria-hidden="true"
                                    className="text-gold-dark transition-transform duration-500 ease-premium group-hover:-translate-x-1.5"
                                >
                                    &larr;
                                </span>
                                <span className="text-[11px] font-semibold tracking-[0.2em] text-royal uppercase">
                                    Back to the Homepage
                                </span>
                            </Link>
                        </Rise>
                    </div>

                    {/* ---------------- Destinations ---------------- */}
                    <div className="lg:col-span-5 lg:col-start-8">
                        <Rise as="p" className="eyebrow border-t border-line pt-10 text-ink-muted">
                            Where to Go Instead
                        </Rise>

                        <nav aria-label="Suggested destinations" className="mt-8">
                            <ul>
                                {destinations.map((destination) => (
                                    <Rise as="li" key={destination.path}>
                                        <Link
                                            href={destination.path}
                                            className="group flex items-center justify-between gap-8 border-t border-line py-5 transition-colors duration-500 ease-premium hover:border-gold"
                                        >
                                            <span className="text-[16px] font-semibold text-royal transition-colors duration-500 ease-premium group-hover:text-royal-light">
                                                {destination.label}
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                className="shrink-0 text-gold-dark transition-transform duration-500 ease-premium group-hover:translate-x-1.5"
                                            >
                                                &rarr;
                                            </span>
                                        </Link>
                                    </Rise>
                                ))}
                            </ul>
                        </nav>

                        <Rise
                            as="p"
                            className="mt-12 max-w-[44ch] border-t border-line pt-8 text-[13px] leading-relaxed text-ink-muted"
                        >
                            If you followed this link from another site or a press release, the corporate desk
                            would like to know about it.{" "}
                            <Link
                                href="/contact"
                                className="border-b border-line text-royal transition-colors duration-500 ease-premium hover:border-gold"
                            >
                                Report a broken link
                            </Link>
                            .
                        </Rise>
                    </div>
                </div>
            </Stagger>
        </section>
    );
}
