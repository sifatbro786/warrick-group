import Image from "next/image";
import { formatLongDate, isoDay } from "@/lib/format";

/**
 * The article reader's content, shared by the modal (intercepted route) and
 * the full /news/[slug] page. Body is plain-text paragraphs rendered as text
 * — no HTML, so nothing to sanitise.
 */
export default function ArticleBody({ article, titleId, footnote, headingLevel = "h2", priority = false }) {
    const Heading = headingLevel;

    return (
        <article className="px-6 pt-12 pb-16 sm:px-10 lg:px-16 lg:pt-16 lg:pb-20">
            <div className="eyebrow flex flex-wrap items-center gap-x-5 gap-y-2">
                {article.category ? <span className="text-gold-dark">{article.category.label}</span> : null}
                <time dateTime={isoDay(article.publishedAt)} className="text-ink-muted">
                    {formatLongDate(article.publishedAt)}
                </time>
                <span className="text-ink-muted">{article.readTime} min read</span>
            </div>

            <Heading
                id={titleId}
                className="mt-8 max-w-[24ch] text-[clamp(1.625rem,3vw,2.5rem)] leading-[1.16] font-bold text-royal"
            >
                {article.title}
            </Heading>

            {article.summary ? (
                <p className="mt-8 max-w-[60ch] border-t border-line pt-8 text-[16px] leading-[1.85] font-medium text-royal/80">
                    {article.summary}
                </p>
            ) : null}

            {article.coverImage?.url ? (
                <figure className="relative mt-12 aspect-video overflow-hidden">
                    <Image
                        src={article.coverImage.url}
                        alt={article.coverImage.alt ?? ""}
                        fill
                        sizes="(min-width: 56rem) 56rem, 100vw"
                        quality={70}
                        preload={priority}
                        style={{ objectPosition: article.coverImage.focal || "center" }}
                        className="object-cover saturate-[0.85]"
                    />
                </figure>
            ) : null}

            <div className="mt-12">
                {(article.content ?? []).map((paragraph, index) => (
                    <p
                        key={paragraph.slice(0, 24)}
                        className={`max-w-[68ch] text-[15px] leading-[1.95] text-ink-muted ${index === 0 ? "" : "mt-7"}`}
                    >
                        {paragraph}
                    </p>
                ))}
            </div>

            {footnote ? (
                <p className="mt-14 border-t border-line pt-8 text-[13px] leading-relaxed text-ink-muted">
                    {footnote}
                </p>
            ) : null}
        </article>
    );
}
