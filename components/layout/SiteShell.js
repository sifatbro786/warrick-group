import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { getCurrentYear, getSiteSettings, listBusinesses, listOffices } from "@/server/services/content";

/**
 * SiteShell
 * ---------------------------------------------------------------------------
 * The persistent chrome around every public route: skip link, primary
 * header, the <main> landmark and the footer. The React site's TopBar is gone
 * (see PHASES.md §3).
 *
 * Used by app/(site)/layout.js and by the root not-found page, which renders
 * outside the (site) group but must still look like the site.
 */
export default async function SiteShell({ children }) {
    const [site, businesses, offices, year] = await Promise.all([
        getSiteSettings(),
        listBusinesses(),
        listOffices(),
        getCurrentYear(),
    ]);

    /* Only what the dropdown prints crosses to the client. */
    const navBusinesses = businesses.map(({ slug, name, descriptor }) => ({ slug, name, descriptor }));

    return (
        <div className="flex min-h-screen flex-col bg-surface-soft">
            {/* Keyboard users can jump straight past the navigation. */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-70 focus:rounded-xs focus:bg-royal focus:px-5 focus:py-3 focus:text-[12px] focus:font-semibold focus:tracking-[0.16em] focus:text-gold focus:uppercase"
            >
                Skip to content
            </a>

            <Navbar brand={site.brand} navigation={site.navigation} businesses={navBusinesses} />

            <main id="main" className="flex-1">
                {children}
            </main>

            <Footer brand={site.brand} footer={site.footer} offices={offices} year={year} />
        </div>
    );
}
