"use client";

import { motion, useReducedMotion } from "framer-motion";

/* Matches --ease-premium in globals.css so JS and CSS motion feel identical. */
export const EASE = [0.22, 1, 0.36, 1];

/**
 * Scroll reveals, ported from the React site's inline `stagger` / `rise`
 * objects. They are the only client JavaScript most sections need, so the
 * sections themselves stay Server Components and pass their markup in as
 * children.
 *
 *   <Stagger as="section">            parent: owns initial/whileInView
 *     <Rise as="p">eyebrow</Rise>     child:  inherits "hidden" → "show"
 *   </Stagger>
 *
 * Variant names propagate through React context, so a <Rise> rendered by a
 * Server Component inside a <Stagger> still animates with its parent.
 */

/** Rise variants. Defaults match the page templates (24px, 0.8s). */
export function useRise(y = 24, duration = 0.8) {
    const reduce = useReducedMotion();
    return {
        hidden: { opacity: 0, y: reduce ? 0 : y },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.25 : duration, ease: EASE } },
    };
}

/**
 * @param {object} props
 * @param {string} [props.as]        element: "div", "section", "dl", "ul", "article"…
 * @param {number} [props.stagger]   seconds between children
 * @param {number} [props.delay]     delayChildren
 * @param {string} [props.margin]    viewport margin
 * @param {boolean} [props.onMount]  animate on mount instead of on scroll (heroes)
 */
export function Stagger({
    as = "div",
    stagger = 0.1,
    delay,
    margin = "-100px",
    onMount = false,
    children,
    ...rest
}) {
    const Component = motion[as];
    const trigger = onMount ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin } };

    return (
        <Component
            initial="hidden"
            {...trigger}
            variants={{
                hidden: {},
                show: { transition: { staggerChildren: stagger, delayChildren: delay } },
            }}
            {...rest}
        >
            {children}
        </Component>
    );
}

/** A child that rises into place when its <Stagger> parent fires. */
export function Rise({ as = "div", y, duration, children, ...rest }) {
    const Component = motion[as];
    const rise = useRise(y, duration);

    return (
        <Component variants={rise} {...rest}>
            {children}
        </Component>
    );
}
