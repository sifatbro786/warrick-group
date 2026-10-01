"use client";

import Link from "next/link";
import { Rise, Stagger } from "@/components/motion/Reveal";

/* ==========================================================================
   ErrorView — the runtime-failure counterpart to NotFoundView, in the same
   layout and voice. Static copy by design. The error itself is never shown:
   messages can carry internals, and `digest` is enough for the server logs.
   ========================================================================== */
export default function ErrorView({ digest, onRetry }) {
    return (
        <section aria-labelledby="error-heading" className="bg-surface-soft">
            <Stagger onMount className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-40">
                <div className="grid gap-x-8 gap-y-14 lg:grid-cols-12 lg:gap-x-20">
                    <div className="lg:col-span-6">
                        <Rise as="p" className="eyebrow text-gold-dark">
                            Service Interruption
                        </Rise>

                        <Rise
                            as="h1"
                            id="error-heading"
                            className="mt-10 max-w-[16ch] text-[clamp(1.875rem,3.4vw,3rem)] leading-[1.1] font-bold text-royal"
                        >
                            This page could not be loaded.
                        </Rise>

                        <Rise as="p" className="mt-8 max-w-[50ch] text-[15px] leading-[1.9] text-ink-muted">
                            Something on our side failed while preparing it. Trying again usually resolves it;
                            if it does not, the corporate desk can help.
                        </Rise>

                        <Rise className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
                            {onRetry ? (
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className="group inline-flex items-center justify-center gap-4 rounded-xs bg-royal px-9 py-4.5 text-[11px] font-semibold tracking-[0.2em] text-gold uppercase transition-all duration-500 ease-premium hover:bg-royal-light"
                                >
                                    Try Again
                                    <span
                                        aria-hidden="true"
                                        className="transition-transform duration-500 ease-premium group-hover:translate-x-1.5"
                                    >
                                        &rarr;
                                    </span>
                                </button>
                            ) : null}

                            <Link
                                href="/"
                                className="group inline-flex items-center gap-4 border-b border-line pb-2 transition-colors duration-500 ease-premium hover:border-gold"
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

                    {digest ? (
                        <div className="lg:col-span-5 lg:col-start-8">
                            <Rise
                                as="p"
                                className="max-w-[44ch] border-t border-line pt-10 text-[13px] leading-relaxed text-ink-muted"
                            >
                                If you contact us about this, quote reference{" "}
                                <span className="text-royal tabular-nums">{digest}</span>.
                            </Rise>
                        </div>
                    ) : null}
                </div>
            </Stagger>
        </section>
    );
}
