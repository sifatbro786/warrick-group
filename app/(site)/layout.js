import SiteShell from "@/components/layout/SiteShell";

/* Public site chrome. /admin (Phase 3) sits outside this group and gets its
   own shell. */
export default function SiteLayout({ children }) {
    return <SiteShell>{children}</SiteShell>;
}
