import NewsBrowser from "@/components/news/NewsBrowser";
import { Rise } from "@/components/motion/Reveal";
import { getPage, listArticles, listNewsCategories } from "@/server/services/content";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("news");
}

/* Newsroom — ported 1:1 from NewsPage.jsx. */
export default async function NewsPage() {
    const [page, categories, articles] = await Promise.all([getPage("news"), listNewsCategories(), listArticles()]);
    const hero = page.hero ?? {};

    const header = (
        <div className="grid gap-x-8 gap-y-8 lg:grid-cols-12 lg:gap-x-20">
            <div className="lg:col-span-7">
                <Rise as="p" className="eyebrow text-gold-dark">
                    {hero.eyebrow}
                </Rise>
                <Rise
                    as="h1"
                    id="newsroom-heading"
                    className="mt-7 max-w-[16ch] text-[clamp(2rem,3.8vw,3.5rem)] leading-[1.1] font-bold text-royal"
                >
                    {hero.title}
                </Rise>
            </div>

            {hero.lead ? (
                <Rise
                    as="p"
                    className="max-w-[52ch] self-end text-[15px] leading-[1.9] text-ink-muted lg:col-span-4 lg:col-start-9"
                >
                    {hero.lead}
                </Rise>
            ) : null}
        </div>
    );

    return (
        <NewsBrowser
            header={header}
            categories={categories.map(({ key, label }) => ({ key, label }))}
            articles={articles}
            emptyState={page.emptyState}
        />
    );
}
