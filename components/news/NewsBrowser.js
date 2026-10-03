"use client";

import { useState } from "react";
import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { formatLongDate, isoDay } from "@/lib/format";

/**
 * Newsroom header strip + release grid. They share the filter state, so both
 * bands live here; the heading copy is server-rendered and passed in as
 * `header`. Articles arrive without bodies: a card links to /news/[slug],
 * which opens in the modal (intercepted route) when clicked here and as a
 * full page when visited directly or crawled.
 *
 * GROUND: header surface-soft → grid white → footer.
 */
export default function NewsBrowser({ header, categories, articles, emptyState }) {
    const [active, setActive] = useState("all");
    const tabs = [{ key: "all", label: "All" }, ...categories];
    const visible =
        active === "all" ? articles : articles.filter((article) => article.category?.key === active);

    return (
        <>
            {/* ========================= HEADER AND FILTER ========================= */}
            <section aria-labelledby="newsroom-heading" className="bg-surface-soft">
                <Stagger css className="mx-auto max-w-360 px-5 pt-20 pb-0 sm:px-6 lg:px-10 lg:pt-32">
                    {header}

                    {/* Text only. The active state is a hairline sitting on the
                        strip's own bottom rule, so nothing gains a background. */}
                    <Rise
                        order={3}
                        role="group"
                        aria-label="Filter releases by category"
                        className="mt-16 flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-line lg:mt-24"
                    >
                        {tabs.map((category) => {
                            const isActive = category.key === active;
                            return (
                                <button
                                    key={category.key}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => setActive(category.key)}
                                    className={`-mb-px border-b pb-5 text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors duration-500 ease-premium ${
                                        isActive
                                            ? "border-gold text-royal"
                                            : "border-transparent text-ink-muted hover:text-royal"
                                    }`}
                                >
                                    {category.label}
                                </button>
                            );
                        })}

                        <span
                            aria-live="polite"
                            className="ml-auto pb-5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase tabular-nums"
                        >
                            {visible.length} {visible.length === 1 ? "Release" : "Releases"}
                        </span>
                    </Rise>
                </Stagger>
            </section>

            {/* ================================ GRID ================================ */}
            <section aria-label="Press releases" className="bg-surface">
                <div className="mx-auto max-w-360 px-5 py-20 sm:px-6 lg:px-10 lg:py-28">
                    <NewsGrid visible={visible} active={active} emptyState={emptyState} />
                </div>
            </section>
        </>
    );
}

function NewsGrid({ visible, active, emptyState }) {
    if (visible.length === 0) {
        return <p className="border-t border-line pt-10 text-[15px] text-ink-muted">{emptyState}</p>;
    }

    return (
        /* Keyed on the filter so a category change replays the stagger. */
        <Stagger
            key={active}
            stagger={0.08}
            margin="-80px"
            className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-12"
        >
            {visible.map((article) => (
                <Rise
                    as="article"
                    key={article.slug}
                    className="group relative flex flex-col border-t border-line pt-8"
                >
                    <div className="relative aspect-3/2 overflow-hidden">
                        <Image
                            src={article.coverImage.url}
                            alt=""
                            fill
                            sizes="(min-width: 64rem) 30vw, (min-width: 48rem) 45vw, 100vw"
                            quality={70}
                            style={{ objectPosition: article.coverImage.focal || "center" }}
                            className="object-cover saturate-[0.82] transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
                        />
                    </div>

                    <div className="eyebrow mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <time dateTime={isoDay(article.publishedAt)} className="text-ink-muted">
                            {formatLongDate(article.publishedAt)}
                        </time>
                        {article.category ? (
                            <span className="text-gold-dark">{article.category.label}</span>
                        ) : null}
                    </div>

                    <h2 className="mt-6 text-[19px] leading-snug font-bold text-royal transition-colors duration-500 ease-premium group-hover:text-royal-light">
                        {/* The card's single interactive element, stretched over the
                            card by the ::after overlay. */}
                        <Link
                            href={`/news/${article.slug}`}
                            scroll={false}
                            className="text-left after:absolute after:inset-0 after:content-['']"
                        >
                            {article.title}
                        </Link>
                    </h2>

                    <p className="mt-5 max-w-[44ch] text-[14px] leading-[1.8] text-ink-muted">
                        {article.summary}
                    </p>

                    <div className="mt-6 flex items-center gap-4 pt-2">
                        <span className="text-[13px] text-ink-muted">{article.readTime} min read</span>
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
    );
}
