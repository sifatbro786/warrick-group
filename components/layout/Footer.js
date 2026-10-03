import Link from "next/link";
import { isExternal, itemKey } from "@/lib/format";

/* ==========================================================================
   Footer — ported 1:1 from warrick-frontend/src/components/common/Footer.jsx.
   Every string comes from SiteSettings (brand + footer); the head office and
   hubs come from the Office collection, so an office edited on the contact
   page is the same record the footer prints.

   GROUND — royal-night, flat. See the GROUND note in the home InquiryCTA
   before changing either one; they are one decision.
   ========================================================================== */

function ColumnHeading({ id, children }) {
    return (
        <h2 id={id} className="eyebrow text-white/40">
            {children}
        </h2>
    );
}

function FooterLink({ href, className, children }) {
    if (isExternal(href)) {
        return (
            <a href={href} className={className} target="_blank" rel="noreferrer noopener">
                {children}
            </a>
        );
    }
    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

const COLUMN_LINK =
    "text-[14px] text-white/70 transition-colors duration-300 ease-premium hover:text-gold-light";

/**
 * @param {{ brand: object, footer: object, offices: Array<object>, year: number }} props
 */
export default function Footer({ brand, footer, offices, year }) {
    const headOffice = offices.find((office) => office.isHeadquarters) ?? offices[0] ?? null;
    const hubs = offices.map((office) => office.city);
    const entities = footer?.entities ?? { links: [] };
    const columns = footer?.columns ?? [];
    const legal = footer?.legal ?? [];

    return (
        <footer className="relative bg-royal-night">
            {/* Seam. A gold hairline that fades out at both ends. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/45 to-transparent"
            />

            <div className="mx-auto max-w-360 px-5 sm:px-6 lg:px-10">
                {/* ============ Brand, desk and directory ============ */}
                <div className="grid gap-x-8 gap-y-14 border-b border-white/10 py-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-12 lg:py-20">
                    {/* ---------------- Brand and desk ---------------- */}
                    <div className="sm:col-span-2 lg:col-span-3">
                        <Link href="/" className="group inline-block">
                            <p className="font-display text-[clamp(1.125rem,1.6vw,1.5rem)] leading-none font-bold tracking-widest text-white uppercase transition-colors duration-500 ease-premium group-hover:text-gold-light">
                                {brand.legalName}
                            </p>
                        </Link>

                        {brand.footerDescription ? (
                            <p className="mt-6 max-w-[38ch] text-[14px] leading-[1.8] text-white/50">
                                {brand.footerDescription}
                            </p>
                        ) : null}

                        {headOffice ? (
                            <div className="mt-8 space-y-3">
                                {headOffice.email ? (
                                    <a
                                        href={`mailto:${headOffice.email}`}
                                        className="block text-[14px] text-white/75 transition-colors duration-500 ease-premium hover:text-gold-light"
                                    >
                                        {headOffice.email}
                                    </a>
                                ) : null}
                                {headOffice.phone ? (
                                    <a
                                        href={`tel:${headOffice.phone}`}
                                        className="block text-[14px] text-white/75 transition-colors duration-500 ease-premium hover:text-gold-light"
                                    >
                                        {headOffice.phoneDisplay || headOffice.phone}
                                    </a>
                                ) : null}
                            </div>
                        ) : null}

                        {footer?.cta?.path ? (
                            <Link
                                href={footer.cta.path}
                                className="group mt-8 inline-flex items-center gap-4 border-b border-gold/40 pb-2 transition-colors duration-500 ease-premium hover:border-gold"
                            >
                                <span className="text-[11px] font-semibold tracking-[0.2em] text-white uppercase">
                                    {footer.cta.label}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className="text-gold transition-transform duration-500 ease-premium group-hover:translate-x-1.5"
                                >
                                    &rarr;
                                </span>
                            </Link>
                        ) : null}
                    </div>

                    {/* ---------------- Entities ---------------- */}
                    {entities.links?.length ? (
                        <nav aria-labelledby="footer-entities" className="lg:col-span-2">
                            <ColumnHeading id="footer-entities">{entities.title}</ColumnHeading>
                            <ul className="mt-7 space-y-4">
                                {entities.links.map((link) => (
                                    <li key={`${link.path}-${link.label}`}>
                                        <FooterLink href={link.path} className={COLUMN_LINK}>
                                            {link.label}
                                        </FooterLink>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ) : null}

                    {/* ---------------- Link columns ---------------- */}
                    {columns.map((column, index) => (
                        <nav
                            key={itemKey(column, index)}
                            aria-labelledby={`footer-col-${index}`}
                            className="lg:col-span-2"
                        >
                            <ColumnHeading id={`footer-col-${index}`}>{column.title}</ColumnHeading>
                            <ul className="mt-7 space-y-4">
                                {column.links.map((link) => (
                                    <li key={`${link.path}-${link.label}`}>
                                        <FooterLink href={link.path} className={COLUMN_LINK}>
                                            {link.label}
                                        </FooterLink>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}

                    {/* ---------------- Registered office ---------------- */}
                    {headOffice ? (
                        <div className="lg:col-span-3">
                            <ColumnHeading id="footer-headquarters">{footer?.headOfficeTitle}</ColumnHeading>

                            <address className="mt-7 text-[14px] leading-[1.8] text-white/55 not-italic">
                                {headOffice.address.map((line) => (
                                    <span key={line} className="block">
                                        {line}
                                    </span>
                                ))}
                            </address>

                            {/* Hubs read as one line of text, so the separators are
                                decorative and hidden rather than announced. */}
                            <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-white/45">
                                {hubs.map((hub, index) => (
                                    <span key={hub} className="inline-flex items-center gap-2.5">
                                        {index > 0 ? (
                                            <span aria-hidden="true" className="text-white/25">
                                                &bull;
                                            </span>
                                        ) : null}
                                        {hub}
                                    </span>
                                ))}
                            </p>
                        </div>
                    ) : null}
                </div>

                {/* ============ Legal ============ */}
                <div className="flex flex-col gap-5 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
                    <p className="text-[12px] text-white/40">
                        &copy; {year} {footer?.copyright}
                    </p>

                    {legal.length ? (
                        <nav aria-label="Legal" className="lg:order-2">
                            <ul className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                {legal.map((link, index) => (
                                    <li key={link.path} className="flex items-center gap-3">
                                        {index > 0 ? (
                                            <span aria-hidden="true" className="text-[10px] text-white/20">
                                                &bull;
                                            </span>
                                        ) : null}
                                        <FooterLink
                                            href={link.path}
                                            className="text-[12px] text-white/40 transition-colors duration-300 ease-premium hover:text-gold-light"
                                        >
                                            {link.label}
                                        </FooterLink>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ) : null}

                    {footer?.status?.isVisible && footer.status.locale ? (
                        <p className="text-[12px] text-white/40 lg:order-3">{footer.status.locale}</p>
                    ) : null}
                </div>
            </div>
        </footer>
    );
}
