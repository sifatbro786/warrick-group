import PageHero from "@/components/ui/PageHero";
import SectionHeading, { SplitHeading } from "@/components/ui/SectionHeading";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { formatMonthYear, pad, statusLabel } from "@/lib/format";
import { getPage, listReports } from "@/server/services/content";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("sustainability");
}

/* ==========================================================================
   Sustainability — ported 1:1 from SustainabilityPage.jsx.
   GROUND: Hero royal-dark → Roadmap white → ESG soft → Reports white.
   NO METERS — progress is stated as a figure, never drawn as a bar.
   `#reports` is the footer's "Annual Reports" target.
   ========================================================================== */
export default async function SustainabilityPage() {
    const [page, reports] = await Promise.all([getPage("sustainability"), listReports()]);
    const { hero = {}, position = [], roadmap = {}, esg = {}, assuranceNote } = page;
    const reportsCopy = page.reports ?? {};

    return (
        <>
            {/* =============================== HERO =============================== */}
            <PageHero
                id="sustainability-heading"
                eyebrow={hero.eyebrow}
                title={hero.title}
                lead={hero.lead}
                titleClass="max-w-[14ch]"
            >
                {position.length ? (
                    <Rise as="dl" className="mt-20 grid grid-cols-2 gap-x-8 gap-y-12 lg:mt-28 lg:grid-cols-4 lg:gap-x-12">
                        {position.map((item) => (
                            <div key={item._id ?? item.label} className="border-t border-white/12 pt-6">
                                <dt className="eyebrow text-white/45">{item.label}</dt>
                                <dd>
                                    <span className="mt-4 block font-display text-[clamp(1.5rem,2.4vw,2.25rem)] leading-none font-bold tracking-tight text-white">
                                        {item.value}
                                        {item.unit ? <span className="text-gold">{item.unit}</span> : null}
                                    </span>
                                    <span className="mt-4 block max-w-[26ch] text-[13px] leading-relaxed text-white/45">
                                        {item.detail}
                                    </span>
                                </dd>
                            </div>
                        ))}
                    </Rise>
                ) : null}
            </PageHero>

            {/* ============================== ROADMAP ============================== */}
            <section aria-labelledby="roadmap-heading" className="border-t border-line bg-surface">
                <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    <SplitHeading
                        id="roadmap-heading"
                        eyebrow={roadmap.heading?.eyebrow}
                        title={roadmap.heading?.title}
                        intro={roadmap.heading?.intro}
                    />

                    {/* The year carries the hierarchy. The active row takes a gold
                        rule instead of a grey one — the only marker on the line. */}
                    <ol className="mt-20 lg:mt-24">
                        {(roadmap.milestones ?? []).map((milestone) => {
                            const isActive = milestone.status === "active";

                            return (
                                <Rise
                                    as="li"
                                    key={milestone._id ?? `${milestone.year}-${milestone.title}`}
                                    className={`grid gap-x-8 gap-y-5 border-t py-10 lg:grid-cols-12 lg:gap-x-20 lg:py-12 ${
                                        isActive ? "border-gold" : "border-line"
                                    }`}
                                >
                                    <div className="lg:col-span-2">
                                        <p
                                            className={`font-display text-[clamp(1.75rem,2.4vw,2.375rem)] leading-none font-bold tracking-tight tabular-nums ${
                                                isActive ? "text-royal" : "text-ink-muted/45"
                                            }`}
                                        >
                                            {milestone.year}
                                        </p>
                                        <p className={`eyebrow mt-4 ${isActive ? "text-gold-dark" : "text-ink-muted/70"}`}>
                                            {statusLabel(milestone.status)}
                                        </p>
                                    </div>

                                    <div className="lg:col-span-5">
                                        <p className="eyebrow text-ink-muted/60">{milestone.phase}</p>
                                        <h3 className="mt-4 max-w-[30ch] text-[18px] leading-snug font-bold text-royal">
                                            {milestone.title}
                                        </h3>
                                        <p className="mt-4 max-w-[40ch] text-[14px] leading-[1.8] font-medium text-royal/70">
                                            {milestone.target}
                                        </p>
                                    </div>

                                    <p className="max-w-[52ch] text-[14px] leading-[1.85] text-ink-muted lg:col-span-4 lg:col-start-9">
                                        {milestone.detail}
                                    </p>
                                </Rise>
                            );
                        })}
                    </ol>

                    <Rise
                        as="p"
                        className="mt-14 max-w-[66ch] border-t border-line pt-8 text-[13px] leading-relaxed text-ink-muted"
                    >
                        {roadmap.baselineYear ? `Baseline year ${roadmap.baselineYear}. ` : ""}
                        {roadmap.targetYear ? `Target year ${roadmap.targetYear}. ` : ""}
                        {assuranceNote}
                    </Rise>
                </Stagger>
            </section>

            {/* ============================ ESG PILLARS ============================ */}
            <section aria-labelledby="esg-heading" className="border-t border-line bg-surface-soft">
                <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    <SectionHeading
                        id="esg-heading"
                        eyebrow={esg.heading?.eyebrow}
                        title={esg.heading?.title}
                        titleClass="max-w-[22ch]"
                    />

                    {/* Hairline rows rather than three columns: each pillar's
                        statement, commitments and readings need the measure. */}
                    <div className="mt-20 lg:mt-24">
                        {(esg.pillars ?? []).map((pillar, index) => (
                            <Rise
                                as="section"
                                key={pillar._id ?? pillar.code}
                                aria-labelledby={`pillar-${pillar.code}`}
                                className="grid gap-x-8 gap-y-10 border-t border-line py-12 lg:grid-cols-12 lg:gap-x-20 lg:py-16"
                            >
                                {/* ---- Identity ---- */}
                                <div className="lg:col-span-3">
                                    <p className="eyebrow text-ink-muted/60">{pad(index + 1)}</p>
                                    <h3
                                        id={`pillar-${pillar.code}`}
                                        className="mt-5 font-display text-[clamp(1.5rem,2vw,2rem)] leading-none font-bold tracking-tight text-royal"
                                    >
                                        {pillar.title}
                                    </h3>
                                    <p className="eyebrow mt-5 text-gold-dark">Scope {pillar.code}</p>
                                </div>

                                {/* ---- Statement and commitments ---- */}
                                <div className="lg:col-span-5">
                                    <p className="max-w-[52ch] text-[15px] leading-[1.9] text-ink-muted">{pillar.statement}</p>
                                    <ul className="mt-9">
                                        {(pillar.commitments ?? []).map((commitment) => (
                                            <li
                                                key={commitment}
                                                className="flex gap-4 border-t border-line py-4 text-[14px] leading-relaxed text-royal/75 first:border-t-0 first:pt-0"
                                            >
                                                <span aria-hidden="true" className="shrink-0 text-gold-dark">
                                                    &rarr;
                                                </span>
                                                <span className="max-w-[48ch]">{commitment}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* ---- Readings ---- */}
                                <dl className="lg:col-span-3 lg:col-start-10">
                                    {(pillar.metrics ?? []).map((metric) => (
                                        <div
                                            key={metric._id ?? metric.label}
                                            className="border-t border-line py-6 first:border-t-0 first:pt-0"
                                        >
                                            <dt className="eyebrow text-ink-muted">{metric.label}</dt>
                                            <dd className="mt-3 font-display text-[clamp(1.375rem,1.8vw,1.75rem)] leading-none font-bold tracking-tight text-royal tabular-nums">
                                                {metric.value}
                                                {metric.unit ? <span className="text-gold-dark">{metric.unit}</span> : null}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </Rise>
                        ))}
                    </div>
                </Stagger>
            </section>

            {/* ============================== REPORTS ============================== */}
            <section id="reports" aria-labelledby="reports-heading" className="border-t border-line bg-surface">
                <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    <SplitHeading
                        id="reports-heading"
                        eyebrow={reportsCopy.heading?.eyebrow}
                        title={reportsCopy.heading?.title}
                        intro={reportsCopy.heading?.intro}
                    />

                    {/* The whole row is one link, so the hit area matches the row
                        while assistive tech reads a single control. */}
                    <ul className="mt-20 lg:mt-24">
                        {reports.map((report) => (
                            <Rise
                                as="li"
                                key={report._id}
                                className="group relative border-t border-line last:border-b"
                            >
                                <a
                                    href={report.fileUrl}
                                    download
                                    className="grid gap-x-8 gap-y-4 py-8 transition-colors duration-500 ease-premium lg:grid-cols-12 lg:items-baseline lg:gap-x-12 lg:py-9"
                                >
                                    <span className="eyebrow text-gold-dark lg:col-span-2">{report.category}</span>
                                    <span className="text-[17px] leading-snug font-bold text-royal transition-colors duration-500 ease-premium group-hover:text-royal-light lg:col-span-5">
                                        {report.title}
                                    </span>
                                    <span className="text-[13px] text-ink-muted lg:col-span-2">{report.period}</span>
                                    <span className="text-[13px] text-ink-muted tabular-nums lg:col-span-2">
                                        {[report.format, report.pages ? `${report.pages} pp` : null, report.fileSize]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>
                                    <span className="flex items-baseline gap-4 lg:col-span-1 lg:justify-end">
                                        <span className="text-[13px] text-ink-muted lg:hidden">
                                            {formatMonthYear(report.publishedAt)}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className="text-gold-dark transition-transform duration-500 ease-premium group-hover:translate-y-1"
                                        >
                                            &darr;
                                        </span>
                                    </span>
                                </a>
                            </Rise>
                        ))}
                    </ul>

                    {reportsCopy.footnote ? (
                        <Rise as="p" className="mt-12 max-w-[66ch] text-[13px] leading-relaxed text-ink-muted">
                            {reportsCopy.footnote}
                        </Rise>
                    ) : null}
                </Stagger>
            </section>
        </>
    );
}
