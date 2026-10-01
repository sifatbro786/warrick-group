"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";

/* ==========================================================================
   Navbar — ported 1:1 from warrick-frontend/src/components/common/Navbar.jsx.
   Content comes from SiteSettings.navigation; the "Our Businesses" dropdown
   is built from the Business collection (passed in as `businesses`).
   ========================================================================== */

const businessPath = (slug) => `/businesses/${slug}`;

/* Wordmark — crown mark paired with the display lockup. */
function Wordmark({ brand, onClick, preload = false }) {
    return (
        <Link
            href="/"
            onClick={onClick}
            aria-label={`${brand.name} — home`}
            className="group flex flex-col items-center justify-center gap-1"
        >
            <Image
                src={brand.logo || "/logo.png"}
                alt=""
                width={552}
                height={435}
                sizes="40px"
                preload={preload}
                className="h-7 w-auto transition-opacity duration-500 ease-premium group-hover:opacity-85"
            />
            <span className="font-display text-[14px] leading-none font-bold tracking-[0.02em] text-royal-dark transition-colors duration-500 ease-premium group-hover:text-royal-light">
                {brand.name}
            </span>
        </Link>
    );
}

/* Hairline gold rule beneath each primary link. Active: solid gold, fully
   drawn. Idle: half-tone, drawn in from centre. */
function NavIndicator({ active }) {
    return (
        <span
            aria-hidden="true"
            className={`absolute -bottom-1.5 left-0 h-px w-full origin-center transition-transform duration-500 ease-premium ${
                active ? "scale-x-100 bg-gold" : "scale-x-0 bg-gold/55 group-hover:scale-x-100"
            }`}
        />
    );
}

/* Hover intent on pointer, click and keyboard elsewhere. */
function BusinessesDropdown({ item, menu, businesses, isSectionActive }) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef(null);
    const wrapperRef = useRef(null);

    const openMenu = () => {
        clearTimeout(closeTimer.current);
        setOpen(true);
    };

    // Grace period so a diagonal cursor path to the panel does not close it.
    const scheduleClose = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(false), 160);
    };

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setOpen(false);
        };
        const handleFocusIn = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("focusin", handleFocusIn);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("focusin", handleFocusIn);
        };
    }, [open]);

    return (
        <div ref={wrapperRef} className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="true"
                className="group relative flex items-center gap-1.5 py-1 text-[12px] font-semibold tracking-[0.14em] uppercase"
            >
                <span
                    className={`transition-colors duration-300 ease-premium ${
                        isSectionActive ? "text-royal" : "text-ink/65 group-hover:text-royal"
                    }`}
                >
                    {item.label}
                </span>
                <ChevronDown
                    className={`size-3 transition-all duration-500 ease-premium ${
                        open ? "rotate-180 text-gold" : "text-ink-muted/70"
                    }`}
                    strokeWidth={2}
                    aria-hidden="true"
                />
                <NavIndicator active={isSectionActive} />
            </button>

            {/* pt-5 leaves an invisible bridge between trigger and panel */}
            <div
                className={`absolute top-full left-1/2 w-100 -translate-x-1/2 pt-5 transition-all duration-500 ease-premium ${
                    open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
                }`}
            >
                <div className="overflow-hidden rounded-[3px] border border-royal/10 bg-white shadow-premium-lg">
                    <p className="px-5 pt-5 pb-1 text-[9px] font-semibold tracking-[0.3em] text-ink-muted/70 uppercase">
                        {menu.eyebrow}
                    </p>

                    <div className="p-2">
                        {businesses.map((division) => (
                            <Link
                                key={division.slug}
                                href={businessPath(division.slug)}
                                tabIndex={open ? 0 : -1}
                                onClick={() => setOpen(false)}
                                className="group/item flex items-start gap-4 rounded-xs px-3 py-4 transition-colors duration-300 hover:bg-surface-card"
                            >
                                <span
                                    aria-hidden="true"
                                    className="mt-2.5 h-px w-5 shrink-0 bg-gold/40 transition-all duration-500 ease-premium group-hover/item:w-9 group-hover/item:bg-gold"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block font-display text-[15px] font-semibold tracking-[0.01em] text-royal">
                                        {division.name}
                                    </span>
                                    <span className="mt-1 block text-[12px] leading-relaxed text-ink-muted">
                                        {division.descriptor}
                                    </span>
                                </span>
                                <ArrowUpRight
                                    className="mt-1 size-3.5 shrink-0 -translate-x-1 text-gold opacity-0 transition-all duration-500 ease-premium group-hover/item:translate-x-0 group-hover/item:opacity-100"
                                    strokeWidth={1.75}
                                    aria-hidden="true"
                                />
                            </Link>
                        ))}
                    </div>

                    <Link
                        href={item.path}
                        tabIndex={open ? 0 : -1}
                        onClick={() => setOpen(false)}
                        className="group/all flex items-center justify-between border-t border-royal/8 bg-surface-card px-5 py-3.5 text-[10px] font-semibold tracking-[0.18em] text-royal/70 uppercase transition-colors duration-300 hover:text-royal"
                    >
                        {menu.viewAllLabel}
                        <ArrowRight
                            className="size-3.5 text-gold transition-transform duration-500 ease-premium group-hover/all:translate-x-1"
                            strokeWidth={1.75}
                            aria-hidden="true"
                        />
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* Full-bleed minimalist overlay. */
function MobileDrawer({ open, onClose, brand, items, cta, menu, businesses, isSectionActive }) {
    const [businessesOpen, setBusinessesOpen] = useState(false);

    // Lock the page behind the overlay and wire up Escape.
    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    return (
        <div
            inert={!open}
            className={`fixed inset-0 z-60 flex flex-col bg-surface transition-opacity duration-500 ease-premium lg:hidden ${
                open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
        >
            <div className="flex h-18 shrink-0 items-center justify-between border-b border-royal/8 px-5 sm:px-6">
                <Wordmark brand={brand} onClick={onClose} />
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close menu"
                    className="-mr-2 p-2 text-royal transition-colors duration-300 hover:text-gold-dark"
                >
                    <X className="size-5" strokeWidth={1.5} />
                </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-8 pb-12 sm:px-6">
                {items.map((item, index) => {
                    const hasChildren = item.showBusinessesMenu && businesses.length > 0;

                    return (
                        <div
                            key={item.path}
                            style={{ transitionDelay: open ? `${120 + index * 55}ms` : "0ms" }}
                            className={`border-b border-royal/8 transition-all duration-700 ease-premium ${
                                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                            }`}
                        >
                            {hasChildren ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setBusinessesOpen((value) => !value)}
                                        aria-expanded={businessesOpen}
                                        className="flex w-full items-center justify-between py-5 text-left"
                                    >
                                        <span
                                            className={`font-display text-[22px] font-semibold tracking-[0.01em] ${
                                                isSectionActive(item) ? "text-royal" : "text-ink/80"
                                            }`}
                                        >
                                            {item.label}
                                        </span>
                                        <ChevronDown
                                            className={`size-4 text-gold-dark transition-transform duration-500 ease-premium ${
                                                businessesOpen ? "rotate-180" : ""
                                            }`}
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                    </button>

                                    {/* grid-rows trick: animates open without measuring height */}
                                    <div
                                        className={`grid transition-all duration-500 ease-premium ${
                                            businessesOpen
                                                ? "grid-rows-[1fr] opacity-100"
                                                : "grid-rows-[0fr] opacity-0"
                                        }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="border-l border-gold/30 pb-5 pl-5">
                                                {businesses.map((division) => (
                                                    <Link
                                                        key={division.slug}
                                                        href={businessPath(division.slug)}
                                                        onClick={onClose}
                                                        className="block py-3"
                                                    >
                                                        <span className="block text-[15px] font-semibold text-royal">
                                                            {division.name}
                                                        </span>
                                                        <span className="mt-0.5 block text-[12px] text-ink-muted">
                                                            {division.descriptor}
                                                        </span>
                                                    </Link>
                                                ))}
                                                <Link
                                                    href={item.path}
                                                    onClick={onClose}
                                                    className="mt-2 inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-royal/70 uppercase"
                                                >
                                                    {menu.mobileViewAllLabel}
                                                    <ArrowRight
                                                        className="size-3 text-gold"
                                                        strokeWidth={2}
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <Link
                                    href={item.path}
                                    onClick={onClose}
                                    className={`block py-5 font-display text-[22px] font-semibold tracking-[0.01em] ${
                                        isSectionActive(item) ? "text-royal" : "text-ink/80"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </div>
                    );
                })}

                {cta?.path ? (
                    <Link
                        href={cta.path}
                        onClick={onClose}
                        style={{ transitionDelay: open ? `${120 + items.length * 55}ms` : "0ms" }}
                        className={`mt-10 flex w-full items-center justify-center gap-3 rounded-xs bg-royal px-8 py-4 text-[12px] font-semibold tracking-[0.2em] text-gold uppercase transition-all duration-700 ease-premium ${
                            open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                        }`}
                    >
                        {cta.label}
                        <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                ) : null}
            </nav>
        </div>
    );
}

/**
 * Sticky primary header.
 * @param {{ brand: object, navigation: object, businesses: Array<{slug,name,descriptor}> }} props
 */
export default function Navbar({ brand, navigation, businesses }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [lastPathname, setLastPathname] = useState(null);
    const pathname = usePathname();

    const items = navigation?.main ?? [];
    const cta = navigation?.cta;
    const menu = navigation?.businessesMenu ?? {};

    // Never leave the drawer open across a navigation — including one driven
    // by the back button. Adjusting during render beats an effect here: the
    // drawer never paints in its open state on the new route.
    if (pathname !== lastPathname) {
        setLastPathname(pathname);
        setMobileOpen(false);
    }

    // Condense the header once the page leaves the top.
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 8);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // A parent stays active for its whole section, not just its index route.
    const isSectionActive = (item) => pathname === item.path || pathname.startsWith(`${item.path}/`);

    return (
        <>
            <header
                className={`sticky top-0 z-50 transition-all duration-500 ease-premium ${
                    scrolled
                        ? "border-b border-royal/10 bg-white/85 shadow-[0_10px_30px_-24px_rgb(46_26_71/0.5)] backdrop-blur-xl"
                        : "border-b border-royal/6 bg-surface"
                }`}
            >
                <div className="mx-auto max-w-360 px-5 sm:px-6 lg:px-10">
                    <div
                        className={`flex items-center justify-between transition-all duration-500 ease-premium ${
                            scrolled ? "h-17" : "h-18 lg:h-23"
                        }`}
                    >
                        <Wordmark brand={brand} preload />

                        {/* --------------- Centre · primary navigation --------------- */}
                        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex xl:gap-11">
                            {items.map((item) =>
                                item.showBusinessesMenu && businesses.length > 0 ? (
                                    <BusinessesDropdown
                                        key={item.path}
                                        item={item}
                                        menu={menu}
                                        businesses={businesses}
                                        isSectionActive={isSectionActive(item)}
                                    />
                                ) : (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        aria-current={isSectionActive(item) ? "page" : undefined}
                                        className="group relative py-1"
                                    >
                                        <span
                                            className={`text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors duration-300 ease-premium ${
                                                isSectionActive(item)
                                                    ? "text-royal"
                                                    : "text-ink/65 group-hover:text-royal"
                                            }`}
                                        >
                                            {item.label}
                                        </span>
                                        <NavIndicator active={isSectionActive(item)} />
                                    </Link>
                                ),
                            )}
                        </nav>

                        {/* --------------- Right · CTA + mobile trigger -------------- */}
                        <div className="flex items-center gap-3">
                            {cta?.path ? (
                                <Link
                                    href={cta.path}
                                    className="group relative hidden overflow-hidden rounded-xs border border-gold/70 px-7 py-3 transition-colors duration-500 ease-premium hover:border-royal lg:inline-flex"
                                >
                                    {/* Fill sweeps up from the baseline — no glow, no gradient. */}
                                    <span
                                        aria-hidden="true"
                                        className="absolute inset-0 origin-bottom scale-y-0 bg-royal transition-transform duration-500 ease-premium group-hover:scale-y-100"
                                    />
                                    <span className="relative text-[11px] font-semibold tracking-[0.2em] text-royal uppercase transition-colors duration-500 ease-premium group-hover:text-gold">
                                        {cta.label}
                                    </span>
                                </Link>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open menu"
                                aria-expanded={mobileOpen}
                                className="-mr-2 p-2 text-royal transition-colors duration-300 hover:text-gold-dark lg:hidden"
                            >
                                <Menu className="size-5" strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <MobileDrawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                brand={brand}
                items={items}
                cta={cta}
                menu={menu}
                businesses={businesses}
                isSectionActive={isSectionActive}
            />
        </>
    );
}
