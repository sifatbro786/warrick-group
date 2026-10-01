"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/components/motion/Reveal";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/* Portals need `document`; this is false during SSR and true after hydration,
   without a setState-in-effect round trip. */
const subscribe = () => () => {};
const useIsClient = () =>
    useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );

/* ==========================================================================
   Dialog — ported 1:1 from warrick-frontend/src/components/common/Dialog.jsx.
   The group's single modal shell: overlay, panel, close control, focus trap,
   Escape, scroll lock with scrollbar compensation, focus restore. Callers
   supply only the content inside the scroll area.

   Portalled to <body> so a fixed overlay opened from inside a `relative
   isolate` section can escape its stacking context.

   PRESENCE — renders motion elements with `exit`, so wrapping the caller in
   <AnimatePresence> with a stable key animates the close.
   ========================================================================== */
export default function Dialog({
    labelledBy,
    onClose,
    closeLabel = "Close",
    panelClass = "max-w-4xl",
    children,
}) {
    const isClient = useIsClient();
    const shouldReduceMotion = useReducedMotion();
    const panelRef = useRef(null);
    const closeRef = useRef(null);
    const restoreFocusRef = useRef(null);

    useEffect(() => {
        restoreFocusRef.current = document.activeElement;
        closeRef.current?.focus();

        const { body, documentElement } = document;
        const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
        const previousOverflow = body.style.overflow;
        const previousPadding = body.style.paddingRight;

        body.style.overflow = "hidden";
        if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            body.style.overflow = previousOverflow;
            body.style.paddingRight = previousPadding;
            /* The opener can be unmounted while the dialog is up. */
            if (document.contains(restoreFocusRef.current)) restoreFocusRef.current?.focus?.();
        };
    }, []);

    const handleKeyDown = useCallback(
        (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== "Tab" || !panelRef.current) return;

            const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
                (node) => node.offsetParent !== null,
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        },
        [onClose],
    );

    if (!isClient) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:py-12"
            onKeyDown={handleKeyDown}
        >
            {/* ---------------- Backdrop ---------------- */}
            <motion.button
                type="button"
                aria-label={closeLabel}
                tabIndex={-1}
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.15 : 0.45, ease: EASE }}
                className="fixed inset-0 -z-10 cursor-default bg-royal-deep/85"
            />

            {/* ---------------- Panel ---------------- */}
            <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.55, ease: EASE }}
                className={`relative flex max-h-[calc(100dvh-3rem)] w-full flex-col bg-surface shadow-premium-lg lg:max-h-[calc(100dvh-6rem)] ${panelClass}`}
            >
                {/* Close bar, outside the scroll container. */}
                <div className="flex shrink-0 justify-end border-b border-line px-6 py-4 sm:px-10">
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        className="group inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase transition-colors duration-500 ease-premium hover:text-royal"
                    >
                        {closeLabel}
                        <span
                            aria-hidden="true"
                            className="text-[15px] leading-none text-gold-dark transition-transform duration-500 ease-premium group-hover:rotate-90"
                        >
                            &#10005;
                        </span>
                    </button>
                </div>

                {/* The dialog's own scroll container. */}
                <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
            </motion.div>
        </div>,
        document.body,
    );
}
