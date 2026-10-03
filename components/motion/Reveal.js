"use client";

import { createContext, useContext } from "react";
import { m, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

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

/**
 * CSS mode (heroes): `<Stagger css>` renders plain elements and its <Rise>
 * children play the `hero-rise` keyframe from globals.css. The animation
 * starts at first paint instead of after hydration, so the hero text is the
 * LCP element within the first frame instead of ~JS-load later. Same curve,
 * distance and stagger as the framer path. Reduced motion is handled by the
 * global prefers-reduced-motion rule.
 */
const CssReveal = createContext(null);

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
 * @param {boolean} [props.onMount]  animate on mount instead of on scroll
 * @param {boolean} [props.css]      on-mount entrance in pure CSS (above-the-fold heroes)
 */
export function Stagger({
    as = "div",
    stagger = 0.1,
    delay,
    margin = "-100px",
    onMount = false,
    css = false,
    children,
    ...rest
}) {
    if (css) {
        const Tag = as;
        return (
            <CssReveal.Provider value={{ stagger, delay: delay ?? 0 }}>
                <Tag {...rest}>{children}</Tag>
            </CssReveal.Provider>
        );
    }

    const Component = m[as];
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
            {/* Nested Rises animate with this Stagger, not an outer CSS one. */}
            <CssReveal.Provider value={null}>{children}</CssReveal.Provider>
        </Component>
    );
}

/** A child that rises into place when its <Stagger> parent fires. */
export function Rise({ as = "div", y, duration, order = 0, className, style, children, ...rest }) {
    const css = useContext(CssReveal);
    const rise = useRise(y, duration);

    if (css) {
        const Tag = as;
        return (
            <Tag
                className={cn("animate-hero-rise", className)}
                style={{ ...style, animationDelay: `${css.delay + order * css.stagger}s` }}
                {...rest}
            >
                {children}
            </Tag>
        );
    }

    const Component = m[as];

    return (
        <Component variants={rise} className={className} style={style} {...rest}>
            {children}
        </Component>
    );
}
