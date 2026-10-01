import NotFoundView from "@/components/NotFoundView";
import SiteShell from "@/components/layout/SiteShell";

export const metadata = { title: "Page Not Found" };

/* Unmatched URLs render here, outside the (site) group, so the chrome is
   added explicitly to keep the 404 looking like the rest of the site. */
export default function RootNotFound() {
    return (
        <SiteShell>
            <NotFoundView />
        </SiteShell>
    );
}
