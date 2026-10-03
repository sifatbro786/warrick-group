"use client";

import { useCallback, useState } from "react";
import Image from "@/components/ui/SmartImage";
import { AnimatePresence } from "framer-motion";
import Dialog from "@/components/dialog/Dialog";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { itemKey, stageLabel } from "@/lib/format";

/* Content only — every modal behaviour belongs to the shared Dialog. */
function VentureDialog({ venture, onClose }) {
    const titleId = `venture-${venture.slug}-title`;
    const { overview = [], milestones = [], partners = [] } = venture.detail ?? {};

    return (
        <Dialog labelledBy={titleId} onClose={onClose}>
            <article className="px-6 pt-12 pb-16 sm:px-10 lg:px-16 lg:pt-16 lg:pb-20">
                <div className="eyebrow flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className="text-gold-dark">{stageLabel(venture.stage)}</span>
                    <span className="text-ink-muted">{venture.sector}</span>
                    {venture.established ? (
                        <span className="text-ink-muted">Established {venture.established}</span>
                    ) : null}
                </div>

                <h2
                    id={titleId}
                    className="mt-8 max-w-[22ch] text-[clamp(1.625rem,3vw,2.5rem)] leading-[1.16] font-bold text-royal"
                >
                    {venture.name}
                </h2>

                <p className="mt-8 max-w-[60ch] border-t border-line pt-8 text-[16px] leading-[1.85] font-medium text-royal/80">
                    {venture.summary}
                </p>

                <figure className="relative mt-12 aspect-16/9 overflow-hidden">
                    <Image
                        src={venture.coverImage.url}
                        alt={venture.coverImage.alt ?? ""}
                        fill
                        sizes="(min-width: 56rem) 56rem, 100vw"
                        quality={70}
                        style={{ objectPosition: venture.coverImage.focal || "center" }}
                        className="object-cover saturate-[0.85]"
                    />
                </figure>

                {/* Programme facts, directly under the plate. */}
                <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
                    <div className="border-t border-line pt-5">
                        <dt className="eyebrow text-ink-muted">Lead Entity</dt>
                        <dd className="mt-3 text-[15px] font-semibold text-royal">{venture.leadEntity}</dd>
                    </div>
                    <div className="border-t border-line pt-5">
                        <dt className="eyebrow text-ink-muted">Location</dt>
                        <dd className="mt-3 text-[15px] font-semibold text-royal">{venture.location}</dd>
                    </div>
                    {milestones.slice(0, 2).map((milestone, index) => (
                        <div key={itemKey(milestone, index)} className="border-t border-line pt-5">
                            <dt className="eyebrow text-ink-muted">{milestone.label}</dt>
                            <dd className="mt-3 font-display text-[18px] leading-none font-bold text-royal tabular-nums">
                                {milestone.value}
                            </dd>
                        </div>
                    ))}
                </dl>

                <div className="mt-14">
                    {overview.map((paragraph, index) => (
                        <p
                            key={paragraph.slice(0, 24)}
                            className={`max-w-[68ch] text-[15px] leading-[1.95] text-ink-muted ${index === 0 ? "" : "mt-7"}`}
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>

                {/* Full milestone set, including the two surfaced above. */}
                {milestones.length ? (
                    <dl className="mt-14 border-t border-line pt-2">
                        {milestones.map((milestone, index) => (
                            <div
                                key={itemKey(milestone, index)}
                                className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-line py-5"
                            >
                                <dt className="text-[14px] text-ink-muted">{milestone.label}</dt>
                                <dd className="font-display text-[17px] leading-none font-bold text-royal tabular-nums">
                                    {milestone.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                ) : null}

                {partners.length ? (
                    <div className="mt-12">
                        <p className="eyebrow text-ink-muted">Delivered With</p>
                        <p className="mt-5 max-w-[60ch] text-[14px] leading-[1.85] text-ink-muted">
                            {partners.join(". ")}.
                        </p>
                    </div>
                ) : null}
            </article>
        </Dialog>
    );
}

/**
 * Venture cards + dialog. The only interactive part of /innovation, so it is
 * the only client island on the page.
 */
export default function VentureGrid({ ventures }) {
    const [openSlug, setOpenSlug] = useState(null);
    const openVenture = ventures.find((venture) => venture.slug === openSlug) ?? null;
    const close = useCallback(() => setOpenSlug(null), []);

    return (
        <>
            <Stagger
                stagger={0.08}
                margin="-80px"
                className="mt-16 grid gap-x-8 gap-y-16 md:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-x-12"
            >
                {ventures.map((venture) => (
                    <Rise
                        as="article"
                        key={venture.slug}
                        className="group relative flex flex-col border-t border-line pt-8"
                    >
                        <div className="relative aspect-3/2 overflow-hidden">
                            <Image
                                src={venture.coverImage.url}
                                alt=""
                                fill
                                sizes="(min-width: 64rem) 30vw, (min-width: 48rem) 45vw, 100vw"
                                quality={70}
                                style={{ objectPosition: venture.coverImage.focal || "center" }}
                                className="object-cover saturate-[0.82] transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
                            />
                        </div>

                        <div className="eyebrow mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <span className="text-gold-dark">{stageLabel(venture.stage)}</span>
                            <span className="text-ink-muted">{venture.sector}</span>
                        </div>

                        <h3 className="mt-6 text-[19px] leading-snug font-bold text-royal transition-colors duration-500 ease-premium group-hover:text-royal-light">
                            {/* The card's single interactive element, stretched over
                                the card by the ::after overlay. */}
                            <button
                                type="button"
                                onClick={() => setOpenSlug(venture.slug)}
                                aria-haspopup="dialog"
                                className="text-left after:absolute after:inset-0 after:content-['']"
                            >
                                {venture.name}
                            </button>
                        </h3>

                        <p className="mt-5 max-w-[44ch] text-[14px] leading-[1.8] text-ink-muted">
                            {venture.summary}
                        </p>

                        <div className="mt-6 flex items-center gap-4 pt-2">
                            <span className="text-[13px] text-ink-muted">{venture.leadEntity}</span>
                            <span
                                aria-hidden="true"
                                className="text-gold-dark opacity-0 transition-all duration-500 ease-premium group-hover:translate-x-1.5 group-hover:opacity-100"
                            >
                                &rarr;
                            </span>
                        </div>
                    </Rise>
                ))}
            </Stagger>

            <AnimatePresence>
                {openVenture ? (
                    <VentureDialog key={openVenture.slug} venture={openVenture} onClose={close} />
                ) : null}
            </AnimatePresence>
        </>
    );
}
