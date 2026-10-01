import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
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

/* Phase 2 replaces this with generateMetadata() reading the SEO collection. */
export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: "Warrick Group",
    icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${jakarta.variable} ${grotesk.variable}`}>
            <body>{children}</body>
        </html>
    );
}
