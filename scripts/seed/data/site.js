/**
 * Site settings singleton (server/models/SiteSettings.js).
 * Source: warrick-frontend/src/data/navigationData.js, contactData.js
 * (`inquiryTypes`) and the strings hardcoded in Navbar.jsx / Footer.jsx.
 *
 * Removed in the Next.js version (kept here as comments for later):
 *
 *   TopBar — dropped entirely, with its routes:
 *     { label: "Investor Relations", path: "/investor-relations" },
 *     { label: "Global Presence",    path: "/global-presence" },
 *     { label: "Media Center",       path: "/media-center" },
 *     plus the stock ticker (stockTicker).
 *
 *   Placeholder ("coming soon") pages — not ported. Their footer links were
 *   either remapped to a real section or removed:
 *     Leadership & Heritage  /leadership         → /about#leadership
 *     Board of Directors     /board              → /about#board
 *     Corporate Governance   /ethics-governance  → /about#governance
 *     Annual Reports         /annual-reports     → /sustainability#reports
 *     Investor Relations     /investor-relations → removed (TopBar page)
 *     Careers                /careers            → removed
 *     Brand Assets           /brand-assets       → removed
 *     Sitemap                /sitemap            → removed (sitemap.xml is
 *                                                  generated in Phase 5)
 */
export default {
    key: "site",

    brand: {
        name: "Warrick Group",
        legalName: "Warrick Corporation",
        logo: "/logo.png",
        footerDescription:
            "Businesses funded on a decade view and held to one standard of engineering and governance.",
    },

    navigation: {
        main: [
            { label: "About Us", path: "/about" },
            { label: "Our Businesses", path: "/businesses", showBusinessesMenu: true },
            { label: "Sustainability", path: "/sustainability" },
            { label: "Innovation", path: "/innovation" },
            { label: "News", path: "/news" },
        ],
        cta: { label: "Inquire", path: "/contact" },
        businessesMenu: {
            eyebrow: "Operating Companies",
            viewAllLabel: "View all businesses",
            mobileViewAllLabel: "View all",
        },
    },

    footer: {
        entities: {
            title: "Group Entities",
            links: [
                {
                    label: "Warrick Corporation",
                    tagline: "Parent holding and infrastructure",
                    path: "/businesses",
                },
                {
                    label: "Clara",
                    tagline: "Consumer technology and e-commerce",
                    path: "/businesses/clara",
                },
                {
                    label: "Warrick Motors",
                    tagline: "Automotive and advanced mobility",
                    path: "/businesses/warrick-motors",
                },
            ],
        },
        columns: [
            {
                title: "Enterprise",
                links: [
                    { label: "Leadership & Heritage", path: "/about#leadership" },
                    { label: "Board of Directors", path: "/about#board" },
                    { label: "Sustainability & ESG", path: "/sustainability" },
                    // { label: "Investor Relations", path: "/investor-relations" },
                    // { label: "Careers", path: "/careers" },
                ],
            },
            {
                title: "Insights",
                links: [
                    { label: "Press Releases", path: "/news" },
                    { label: "Annual Reports", path: "/sustainability#reports" },
                    // { label: "Brand Assets", path: "/brand-assets" },
                    { label: "Corporate Governance", path: "/about#governance" },
                ],
            },
        ],
        legal: [
            { label: "Privacy Policy", path: "/privacy" },
            { label: "Terms of Service", path: "/terms" },
            // { label: "Sitemap", path: "/sitemap" },
        ],
        headOfficeTitle: "Global Headquarters",
        cta: { label: "Submit an Inquiry", path: "/contact" },
        copyright: "Warrick Corporation. All rights reserved.",
        status: {
            isVisible: true,
            label: "Global Operations",
            state: "Nominal",
            locale: "English (Global)",
        },
    },

    /* routeTo is server-only: the contact action reads it to pick the desk
       mailbox. Never expose it to the client. */
    inquiryTypes: [
        { key: "investor-relations", label: "Investor Relations", routeTo: "investors@warrickgroup.com" },
        { key: "media", label: "Media and Press", routeTo: "press@warrickgroup.com" },
        { key: "partnership", label: "Strategic Partnership", routeTo: "partnerships@warrickgroup.com" },
    ],

    seo: {
        siteName: "Warrick Group",
        titleTemplate: "%s | Warrick Group",
        defaultTitle: "Warrick Group — Energy, Consumer Technology & Mobility",
        defaultDescription:
            "Warrick Corporation is a privately held group operating across energy infrastructure, consumer technology and advanced mobility. We hold assets for decades, not quarters.",
        defaultOgImage: "/logo.png",
        twitterHandle: "",
        locale: "en_GB",
        googleVerification: "",
        bingVerification: "",
        sameAs: [],
    },
};
