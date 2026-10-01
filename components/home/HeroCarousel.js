"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Swiper from "swiper";
import { A11y, Autoplay, EffectFade, FreeMode, Keyboard, Thumbs } from "swiper/modules";
import { pad } from "@/lib/format";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

const AUTOPLAY_DELAY = 7000;

/* Slide copy rises into place as its slide becomes active, driven off
   Swiper's own state class. This MUST stay a keyframe animation: a CSS
   transition here bubbles a transitionend up to the slide and leaves
   swiper.animating stuck true (see hero-rise in globals.css). */
const REVEAL = "opacity-0 in-[.swiper-slide-active]:animate-hero-rise";

/* ==========================================================================
   HeroCarousel — ported 1:1 from warrick-frontend HeroSection.jsx.
   Slides come from the home page document (hero.slides).

   Occupies exactly one viewport minus the header, so the fold lands on the
   control bar. The 32rem floor is the escape hatch for very short windows.

   WHY SWIPER CORE AND NOT swiper/react — swiper/react constructs its
   instance during render, which reads the clock, and Cache Components
   refuses that in a prerender. Wrapping it in <Suspense> would turn the LCP
   image into a streamed hole. Instead the markup below is plain JSX that
   prerenders to static HTML (first slide already marked active, so it
   paints and animates before any JS), and Swiper core attaches to that same
   DOM after hydration. Nothing re-mounts, so the hero-rise / hero-pan
   keyframes never replay.
   ========================================================================== */
export default function HeroCarousel({ srHeading, slides }) {
    const mainRef = useRef(null);
    const thumbsRef = useRef(null);
    const progressRef = useRef(null);
    const swiperRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const total = slides.length;

    useEffect(() => {
        if (!mainRef.current || !thumbsRef.current) return undefined;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        /* Entity strip. slidesPerView "auto" + free mode means a fourth or
           fifth company scrolls rather than squeezing the others. */
        const thumbs = new Swiper(thumbsRef.current, {
            modules: [FreeMode, Thumbs],
            watchSlidesProgress: true,
            freeMode: true,
            slidesPerView: "auto",
            spaceBetween: 0,
        });

        const main = new Swiper(mainRef.current, {
            modules: [A11y, Autoplay, EffectFade, Keyboard, Thumbs],
            effect: "fade",
            fadeEffect: { crossFade: true },
            speed: reduceMotion ? 0 : 900,
            /* rewind, not loop: loop gates slideNext/slidePrev behind
               `animating`, so one missed transitionend kills the arrows. */
            rewind: total > 1,
            keyboard: { enabled: true },
            autoplay: reduceMotion
                ? false
                : { delay: AUTOPLAY_DELAY, disableOnInteraction: false, pauseOnMouseEnter: true },
            thumbs: { swiper: thumbs },
            on: {
                slideChange: (swiper) => setActiveIndex(swiper.realIndex),
                /* `progress` runs 1 → 0. Written straight to the node to keep
                   autoplay off the render path. */
                autoplayTimeLeft: (_swiper, _timeLeft, progress) => {
                    if (progressRef.current) progressRef.current.style.transform = `scaleX(${1 - progress})`;
                },
            },
        });
        swiperRef.current = main;

        return () => {
            swiperRef.current = null;
            main.destroy(true, false);
            thumbs.destroy(true, false);
        };
    }, [total]);

    return (
        <section
            aria-roledescription="carousel"
            aria-label="Warrick Group operating companies"
            className="relative isolate flex h-[calc(100svh-var(--header-height))] min-h-128 flex-col overflow-hidden bg-royal-dark"
        >
            <h1 className="sr-only">{srHeading}</h1>

            {/* Stage. Takes whatever space the control bar leaves behind. */}
            <div ref={mainRef} className="swiper min-h-0 w-full flex-1">
                <div className="swiper-wrapper">
                    {slides.map((slide, index) => (
                        <div
                            key={slide._id ?? slide.name}
                            className={`swiper-slide relative overflow-hidden ${index === 0 ? "swiper-slide-active" : ""}`}
                        >
                            {/* Plate. bg-royal-dark on the section is the fallback. */}
                            <Image
                                src={slide.image.url}
                                alt=""
                                aria-hidden="true"
                                fill
                                sizes="100vw"
                                quality={70}
                                preload={index === 0}
                                loading={index === 0 ? "eager" : "lazy"}
                                onError={(event) => {
                                    event.currentTarget.style.visibility = "hidden";
                                }}
                                style={{ objectPosition: slide.image.focal || "center" }}
                                className="-z-10 scale-108 object-cover in-[.swiper-slide-active]:animate-hero-pan"
                            />

                            {/* Readability wash: deep cinematic charcoal. */}
                            <div aria-hidden="true" className="absolute inset-0 -z-10">
                                <div className="absolute inset-0 bg-[#0B0F19]/10" />
                                <div className="absolute inset-0 bg-linear-to-r from-[#0B0F19] via-[#0B0F19]/50 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-[#0B0F19] via-[#0B0F19]/40 to-transparent" />
                            </div>

                            {/* Editorial column */}
                            <div className="relative mx-auto flex h-full w-full max-w-360 flex-col justify-center px-5 py-[clamp(1.5rem,4vh,3.5rem)] sm:px-6 lg:px-10">
                                <div className="max-w-2xl">
                                    <p
                                        style={{ animationDelay: "80ms" }}
                                        className={`eyebrow text-white/65 ${REVEAL}`}
                                    >
                                        {slide.sector}
                                    </p>

                                    <h2
                                        style={{ animationDelay: "180ms" }}
                                        className={`mt-5 max-w-[50ch] font-display text-[clamp(1.9rem,3.2vh+1.5vw,4rem)] leading-[1.08] font-bold tracking-[-0.015em] text-white ${REVEAL}`}
                                    >
                                        {slide.headline}
                                    </h2>

                                    <p
                                        style={{ animationDelay: "280ms" }}
                                        className={`mt-6 max-w-[52ch] text-[clamp(0.875rem,1.4vh+0.35vw,1.0625rem)] leading-[1.75] text-white/70 ${REVEAL}`}
                                    >
                                        {slide.body}
                                    </p>

                                    {slide.path ? (
                                        <div style={{ animationDelay: "380ms" }} className={REVEAL}>
                                            <Link
                                                href={slide.path}
                                                tabIndex={index === activeIndex ? 0 : -1}
                                                className="group mt-8 inline-flex items-center gap-4 border-b border-gold/45 pb-2 transition-colors duration-500 ease-premium hover:border-gold"
                                            >
                                                <span className="text-[11px] font-semibold tracking-[0.2em] text-white uppercase">
                                                    {slide.ctaLabel}
                                                </span>
                                                <ArrowRight
                                                    className="size-4 text-gold transition-transform duration-500 ease-premium group-hover:translate-x-1.5"
                                                    strokeWidth={1.75}
                                                    aria-hidden="true"
                                                />
                                            </Link>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Control bar. In flow beneath the stage, never overlaps the copy. */}
            <div className="relative z-20 shrink-0 bg-royal-dark/50 backdrop-blur-sm">
                <div className="mx-auto max-w-360 px-5 sm:px-6 lg:px-10">
                    {/* Autoplay progress doubles as the bar's top rule. */}
                    <div aria-hidden="true" className="relative h-px w-full bg-white/15">
                        <span ref={progressRef} className="absolute inset-0 origin-left scale-x-0 bg-gold" />
                    </div>

                    <div className="flex items-center justify-between gap-6">
                        {/* Entity strip. A fourth or fifth company scrolls rather
                            than squeezing the others out of shape. */}
                        <div ref={thumbsRef} className="swiper min-w-0 flex-1">
                            <div className="swiper-wrapper">
                                {slides.map((slide, index) => (
                                    <div
                                        key={slide._id ?? slide.name}
                                        className={`swiper-slide w-auto! ${index === 0 ? "swiper-slide-thumb-active" : ""}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => swiperRef.current?.slideTo(index)}
                                            aria-label={`Show ${slide.name}`}
                                            aria-current={index === activeIndex}
                                            className="group flex items-baseline gap-3 border-t-2 border-transparent py-5 pr-8 text-left transition-colors duration-500 ease-premium in-[.swiper-slide-thumb-active]:border-gold"
                                        >
                                            <span className="font-display text-[10px] font-bold tracking-widest text-white/35 transition-colors duration-500 ease-premium group-hover:text-white/60 in-[.swiper-slide-thumb-active]:text-gold">
                                                {pad(index + 1)}
                                            </span>
                                            <span className="text-[12px] font-semibold tracking-[0.14em] whitespace-nowrap text-white/50 uppercase transition-colors duration-500 ease-premium group-hover:text-white in-[.swiper-slide-thumb-active]:text-white">
                                                {slide.name}
                                            </span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Counter and arrows */}
                        <div className="flex shrink-0 items-center gap-6">
                            {/* Decorative: the A11y module already announces changes. */}
                            <p
                                aria-hidden="true"
                                className="font-display text-[12px] font-semibold tracking-[0.16em] tabular-nums text-white/35"
                            >
                                <span className="text-gold">{pad(activeIndex + 1)}</span>
                                <span aria-hidden="true" className="mx-1.5">
                                    /
                                </span>
                                {pad(total)}
                            </p>

                            <div className="hidden items-center gap-2 sm:flex">
                                <button
                                    type="button"
                                    onClick={() => swiperRef.current?.slidePrev()}
                                    aria-label="Previous company"
                                    className="grid size-10 place-items-center rounded-xs border border-white/20 text-white/70 transition-colors duration-500 ease-premium hover:border-gold hover:text-gold"
                                >
                                    <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => swiperRef.current?.slideNext()}
                                    aria-label="Next company"
                                    className="grid size-10 place-items-center rounded-xs border border-white/20 text-white/70 transition-colors duration-500 ease-premium hover:border-gold hover:text-gold"
                                >
                                    <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
