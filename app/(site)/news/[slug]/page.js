import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/news/ArticleBody";
import { getArticleBySlug, getPage, listArticles } from "@/server/services/content";
import { buildPageMetadata } from "@/server/services/seo";

/* Every published release is prerendered; new ones render on first visit.
   The placeholder keeps an empty newsroom from failing the build (404s). */
export async function generateStaticParams() {
    const articles = await listArticles();
    return articles.length ? articles.map(({ slug }) => ({ slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (!article) return { title: "Release Not Found" };

    return buildPageMetadata("news", {
        path: `/news/${article.slug}`,
        title: article.seo?.title || article.title,
        description: article.seo?.description || article.summary,
        image: article.seo?.ogImage || article.coverImage?.url,
        noindex: article.seo?.noindex,
        type: "article",
        publishedTime: article.publishedAt,
    });
}

/* ==========================================================================
   A release at its own address — what a direct visit, a refresh, a shared
   link or a crawler sees. The reader is the same markup as the dialog,
   set in a panel of the same width, so the two read as one design.
   ========================================================================== */
export default async function ArticlePage({ params }) {
    const { slug } = await params;
    const [article, page] = await Promise.all([getArticleBySlug(slug), getPage("news")]);
    if (!article) notFound();

    return (
        <section className="bg-surface-soft">
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
                <Link
                    href="/news"
                    className="group inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase transition-colors duration-500 ease-premium hover:text-royal"
                >
                    <span
                        aria-hidden="true"
                        className="text-gold-dark transition-transform duration-500 ease-premium group-hover:-translate-x-1.5"
                    >
                        &larr;
                    </span>
                    {page.hero?.title || "Newsroom"}
                </Link>

                <div className="mt-10 bg-surface shadow-premium">
                    <ArticleBody
                        article={article}
                        titleId="article-title"
                        footnote={page.articleFootnote}
                        headingLevel="h1"
                        priority
                    />
                </div>
            </div>
        </section>
    );
}
