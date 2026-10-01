/**
 * The one place the group site hands a reader off to a company's own site.
 * `status: "live"` renders a real anchor; "pending" prints the domain as text
 * with a launch note, so the site never links to a domain that is not up.
 */
export default function ExternalSiteLink({ website, entityName, tone = "light" }) {
    if (!website) return null;
    const isDark = tone === "dark";

    if (website.status !== "live") {
        return (
            <div>
                <p className={`text-[15px] font-semibold ${isDark ? "text-white/70" : "text-royal"}`}>
                    {website.display}
                </p>
                <p className={`eyebrow mt-3 ${isDark ? "text-white/40" : "text-ink-muted"}`}>
                    Site launching soon
                </p>
            </div>
        );
    }

    return (
        <a
            href={website.url}
            target="_blank"
            rel="noreferrer noopener"
            className={`group inline-flex items-center gap-4 border-b pb-2 transition-colors duration-500 ease-premium ${
                isDark ? "border-gold/40 hover:border-gold" : "border-line hover:border-gold"
            }`}
        >
            <span
                className={`text-[11px] font-semibold tracking-[0.2em] uppercase ${isDark ? "text-white" : "text-royal"}`}
            >
                Visit {entityName}
            </span>
            <span
                aria-hidden="true"
                className={`transition-transform duration-500 ease-premium group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                    isDark ? "text-gold" : "text-gold-dark"
                }`}
            >
                &#8599;
            </span>
        </a>
    );
}
