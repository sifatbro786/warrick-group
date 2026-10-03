import Link from "next/link";
import { requireUser } from "@/server/auth/dal";
import { siteEnv } from "@/server/env";
import { getSiteForEdit, listRouteSeo } from "@/server/services/cms";
import { editorContext } from "@/server/services/cms-context";
import { SITE_SECTIONS } from "@/server/validators/cms";
import { PageHeader, Panel, PanelHeader } from "@/components/admin/ui/Panel";
import { SiteSectionEditor } from "@/components/admin/cms/Editors";
import RouteSeoTable from "@/components/admin/seo/RouteSeoTable";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export const metadata = { title: "SEO" };

export default async function SeoPage() {
    await requireUser();
    const [site, routes, cms] = await Promise.all([getSiteForEdit(), listRouteSeo(), editorContext(SITE_SECTIONS.seo.fields)]);
    const seo = site?.seo ?? {};

    return (
        <>
            <PageHeader
                eyebrow="Site"
                title="Search & social"
                description="How every page appears in Google and when shared. Page settings override the site-wide defaults; a business or article can override both from its own editor."
            />

            <div className="space-y-6">
                <Panel>
                    <PanelHeader title="Pages" description="One record per public page. Detail pages fall back to their section's record." />
                    <RouteSeoTable
                        routes={routes}
                        siteUrl={siteEnv().NEXT_PUBLIC_SITE_URL}
                        defaults={{ title: seo.defaultTitle, description: seo.defaultDescription, template: seo.titleTemplate }}
                        cms={cms}
                    />
                </Panel>

                <Panel id="defaults">
                    <PanelHeader title={SITE_SECTIONS.seo.label} description={SITE_SECTIONS.seo.description} />
                    <div className="px-5 py-5">
                        <SiteSectionEditor sectionKey="seo" doc={seo} cms={cms} />
                    </div>
                </Panel>

                <p className="text-[12.5px] text-ink-muted">
                    Per-item overrides: open a company in{" "}
                    <Link href="/admin/businesses" className="text-royal-light hover:text-royal">
                        Businesses
                    </Link>{" "}
                    or a release in the{" "}
                    <Link href="/admin/articles" className="text-royal-light hover:text-royal">
                        Newsroom
                    </Link>{" "}
                    and use its “Search & social” section. The sitemap and structured data arrive in Phase 5.
                </p>
            </div>
        </>
    );
}
