import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { buildRootMetadata } from "@/server/services/seo";
import "./globals.css";

/* Self-hosted at build time by next/font: no request to Google at runtime and
   no layout shift. Both are variable fonts, so no `weight` list is needed. */
const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    style: ["normal", "italic"],
    variable: "--font-jakarta",
    display: "swap",
});

const grotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-grotesk",
    display: "swap",
});

/* Site-wide defaults (title template, description, OG, verification) from
   SiteSettings.seo. Each page refines them from its SeoSetting record. */
export function generateMetadata() {
    return buildRootMetadata();
}

export default function RootLayout({ children }) {
    /* data-scroll-behavior: globals.css sets smooth scrolling for in-page
       anchors; this tells Next to switch it off during route changes. */
    /* suppressHydrationWarning on <body>: browser extensions (ColorZilla's
       cz-shortcut-listen, Grammarly, password managers…) add attributes to
       <body> before React hydrates. One level deep only — it does not hide
       mismatches in the page content. */
    return (
        <html lang="en" className={`${jakarta.variable} ${grotesk.variable}`} data-scroll-behavior="smooth">
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
