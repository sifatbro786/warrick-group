import { notFound } from "next/navigation";
import ArticleBody from "@/components/news/ArticleBody";
import ArticleModal from "@/components/news/ArticleModal";
import { getArticleBySlug, getPage, listArticles } from "@/server/services/content";

export async function generateStaticParams() {
    const articles = await listArticles();
    return articles.length ? articles.map(({ slug }) => ({ slug })) : [{ slug: "none" }];
}

/* Intercepted /news/[slug]: the same release, rendered in the dialog over
   the newsroom grid. Only reached by client-side navigation from /news. */
export default async function ArticleModalPage({ params }) {
    const { slug } = await params;
    const [article, page] = await Promise.all([getArticleBySlug(slug), getPage("news")]);
    if (!article) notFound();

    const titleId = `article-${article.slug}-title`;

    return (
        <ArticleModal titleId={titleId}>
            <ArticleBody article={article} titleId={titleId} footnote={page.articleFootnote} />
        </ArticleModal>
    );
}
