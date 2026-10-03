"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Framer Motion's lean mode for the public site. Components use `m.*` (from
 * Reveal.js / Dialog.js) instead of `motion.*`, and only the `domAnimation`
 * feature set ships: variants, whileInView, exit, hover/tap. No drag or
 * layout animations, which the site doesn't use.
 *
 * Loaded synchronously on purpose: the hero copy starts at opacity 0 and
 * rises in on mount, so deferring the features would delay the LCP text.
 * `strict` makes any stray `motion.*` throw in development instead of
 * silently pulling the full bundle back in.
 */
export default function MotionProvider({ children }) {
    return (
        <LazyMotion features={domAnimation} strict>
            {children}
        </LazyMotion>
    );
}
