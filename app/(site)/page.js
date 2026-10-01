import BrandsSection from "@/components/home/BrandsSection";
import CommitmentSection from "@/components/home/CommitmentSection";
import FounderSection from "@/components/home/FounderSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import InquiryCTA from "@/components/home/InquiryCTA";
import LatestNews from "@/components/home/LatestNews";
import PortfolioSection from "@/components/home/PortfolioSection";
import StatsSection from "@/components/home/StatsSection";
import { getPage, getSiteSettings, listArticles } from "@/server/services/content";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("home");
}

/**
 * Home. Composition only — each section owns its spacing and ground.
 * Grounds alternate down the page (royal-dark → white → soft → white → soft
 * → white → soft → royal), so a reorder has to re-deal them.
 */
export default async function HomePage() {
    const [page, site] = await Promise.all([getPage("home"), getSiteSettings()]);
    const articles = await listArticles({ limit: page.news?.limit ?? 3 });

    return (
        <>
            <HeroCarousel srHeading={page.hero?.srHeading} slides={page.hero?.slides ?? []} />
            <StatsSection heading={page.stats?.heading} items={page.stats?.items} />
            <FounderSection founder={page.founder} legalName={site.brand.legalName} />
            <PortfolioSection
                heading={page.portfolio?.heading}
                items={page.portfolio?.items}
                itemCtaLabel={page.portfolio?.itemCtaLabel}
            />
            <BrandsSection heading={page.brands?.heading} items={page.brands?.items} />
            <CommitmentSection
                heading={page.commitment?.heading}
                image={page.commitment?.image}
                values={page.commitment?.values}
            />
            <LatestNews heading={page.news?.heading} cta={page.news?.cta} articles={articles} />
            <InquiryCTA
                heading={page.inquiry?.heading}
                statement={page.inquiry?.statement}
                channels={page.inquiry?.channels}
            />
        </>
    );
}
