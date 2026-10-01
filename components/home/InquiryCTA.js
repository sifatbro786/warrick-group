import Link from "next/link";
import { Rise, Stagger } from "@/components/motion/Reveal";

/* ==========================================================================
   InquiryCTA — routing, not collecting. Each channel is a full-width row.

   GROUND — this block and the footer are the two dark surfaces ending the
   page, so they separate on value (royal vs royal-night) AND finish (lit
   wash vs matte). Keep both; on royal-dark the two fuse.
   ========================================================================== */
export default function InquiryCTA({ heading = {}, statement, channels = [] }) {
    return (
        <section aria-labelledby="inquiries-heading" className="relative isolate overflow-hidden bg-royal">
            {/* Directional wash. Light enters top-left and falls away. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-linear-to-br from-royal-light/45 via-royal/0 to-royal-deep/70" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-royal-deep/60 to-transparent" />
            </div>

            <Stagger className="mx-auto grid max-w-360 gap-x-8 gap-y-12 px-5 py-24 sm:px-6 lg:grid-cols-12 lg:gap-x-16 lg:px-10 lg:py-32">
                {/* ---------------- Statement ---------------- */}
                <div className="lg:col-span-5">
                    <Rise as="p" className="eyebrow text-gold">
                        {heading.eyebrow}
                    </Rise>

                    <Rise
                        as="h2"
                        id="inquiries-heading"
                        className="mt-6 max-w-[17ch] text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.15] font-bold text-white"
                    >
                        {heading.title}
                    </Rise>

                    {statement ? (
                        <Rise as="p" className="mt-8 max-w-[48ch] text-[15px] leading-[1.85] text-white/55">
                            {statement}
                        </Rise>
                    ) : null}
                </div>

                {/* ---------------- Channels ---------------- */}
                <div className="lg:col-span-6 lg:col-start-7 lg:pt-2">
                    {channels.map((channel) => (
                        <Rise key={channel._id ?? channel.path}>
                            <Link
                                href={channel.path}
                                className="group flex items-start justify-between gap-8 border-t border-white/12 py-8 transition-colors duration-500 ease-premium hover:border-gold/60 lg:py-10"
                            >
                                <span className="min-w-0">
                                    <span className="block text-[clamp(1.125rem,1.5vw,1.375rem)] font-bold text-white transition-colors duration-500 ease-premium group-hover:text-gold-light">
                                        {channel.label}
                                    </span>
                                    <span className="mt-3 block max-w-[42ch] text-[14px] leading-relaxed text-white/50">
                                        {channel.detail}
                                    </span>
                                </span>

                                <span
                                    aria-hidden="true"
                                    className="mt-1 shrink-0 text-[18px] text-gold transition-transform duration-500 ease-premium group-hover:translate-x-1.5"
                                >
                                    &rarr;
                                </span>
                            </Link>
                        </Rise>
                    ))}
                </div>
            </Stagger>
        </section>
    );
}
