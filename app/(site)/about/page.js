import ArrowLink from "@/components/ui/ArrowLink";
import PageHero from "@/components/ui/PageHero";
import Plate from "@/components/ui/Plate";
import SectionHeading, { SplitHeading } from "@/components/ui/SectionHeading";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { pad, itemKey } from "@/lib/format";
import { getPage, getSiteSettings, listLeaders } from "@/server/services/content";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("about");
}

/* ==========================================================================
   About — ported 1:1 from warrick-frontend/src/pages/AboutPage.jsx.

   GROUND — Hero royal-dark → Story white → Principals soft → Leadership
   white → Governance soft → footer. Governance stays light so the footer
   separates.

   Anchors for the footer: #leadership (principals), #board (non-executive
   roster), #governance.
   ========================================================================== */
export default async function AboutPage() {
    const [page, leaders, site] = await Promise.all([getPage("about"), listLeaders(), getSiteSettings()]);
    const { hero = {}, story = {}, principals = {}, executives = {}, board = {}, governance = {} } = page;
    const legalName = site.brand.legalName;

    const principalPeople = leaders.filter((person) => person.isPrincipal);
    const executiveTeam = leaders.filter((person) => person.type === "executive" && !person.isPrincipal);
    const boardMembers = leaders.filter((person) => person.type === "board");

    return (
        <>
            {/* ============================== HERO ============================== */}
            <PageHero
                id="about-heading"
                eyebrow={hero.eyebrow}
                title={hero.title}
                lead={hero.lead}
                titleClass="max-w-[18ch]"
                leadClass="max-w-[52ch]"
            >
                {hero.meta?.length ? (
                    <Rise
                        as="dl"
                        order={3}
                        className="mt-20 grid grid-cols-2 gap-x-8 gap-y-10 lg:mt-28 lg:grid-cols-4 lg:gap-x-12"
                    >
                        {hero.meta.map((item, index) => (
                            <div key={itemKey(item, index)} className="border-t border-white/12 pt-6">
                                <dt className="eyebrow text-white/45">{item.label}</dt>
                                <dd className="mt-4 font-display text-[clamp(1.5rem,2.4vw,2.25rem)] leading-none font-bold tracking-tight text-white">
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </Rise>
                ) : null}
            </PageHero>

            {/* ======================= HISTORY AND MISSION ======================= */}
            <section aria-labelledby="story-heading" className="border-t border-line bg-surface">
                <Stagger className="mx-auto grid max-w-360 gap-x-8 gap-y-16 px-5 py-24 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-x-20 lg:px-10 lg:py-32">
                    <div className="lg:col-span-6">
                        <SectionHeading id="story-heading" eyebrow={story.eyebrow} title={story.title} />

                        {(story.history ?? []).map((paragraph, index) => (
                            <Rise
                                as="p"
                                key={paragraph.slice(0, 24)}
                                className={`max-w-[58ch] text-[15px] leading-[1.9] text-ink-muted ${index === 0 ? "mt-12" : "mt-7"}`}
                            >
                                {paragraph}
                            </Rise>
                        ))}
                    </div>

                    <div className="lg:col-span-5 lg:col-start-8">
                        {story.missionStatement ? (
                            <Rise
                                as="p"
                                className="max-w-[30ch] border-t border-line pt-10 font-display text-[clamp(1.25rem,1.7vw,1.625rem)] leading-[1.45] font-medium text-balance text-royal"
                            >
                                {story.missionStatement}
                            </Rise>
                        ) : null}

                        <dl className="mt-14">
                            {(story.values ?? []).map((value, index) => (
                                <Rise key={itemKey(value, index)} className="border-t border-line py-8 last:pb-0">
                                    <dt className="flex items-baseline gap-5">
                                        <span className="eyebrow text-ink-muted/60">{pad(index + 1)}</span>
                                        <span className="text-[17px] font-bold text-royal">{value.title}</span>
                                    </dt>
                                    <dd className="mt-3.5 max-w-[48ch] pl-[calc(2ch+1.25rem)] text-[14px] leading-[1.8] text-ink-muted">
                                        {value.detail}
                                    </dd>
                                </Rise>
                            ))}
                        </dl>
                    </div>
                </Stagger>
            </section>

            {/* =========================== PRINCIPALS ===========================
                Two founding officers, given equal ground: same plate ratio,
                same type sizes, same rules on both sides. */}
            {principalPeople.length ? (
                <section
                    id="leadership"
                    aria-labelledby="principals-heading"
                    className="border-t border-line bg-surface-soft"
                >
                    <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                        <SectionHeading
                            id="principals-heading"
                            eyebrow={principals.heading?.eyebrow}
                            title={principals.heading?.title}
                            titleClass="max-w-[22ch]"
                        />

                        {/* Each plate is capped at 34rem and pushed to the outer edge
                            of its cell, so a 4:5 portrait lands around 680px tall. */}
                        <div className="mt-16 grid gap-x-8 gap-y-24 lg:mt-24 lg:grid-cols-2 lg:gap-x-24">
                            {principalPeople.map((person) => (
                                <Rise
                                    as="article"
                                    key={person.key}
                                    className="w-full lg:max-w-136 lg:odd:justify-self-start lg:even:justify-self-end"
                                >
                                    <Plate
                                        image={person.photo}
                                        alt={person.photo?.alt || `${person.name}, ${person.title} of ${legalName}`}
                                        ratio="aspect-4/5"
                                        sizes="(min-width: 64rem) 44vw, 100vw"
                                        quality={85}
                                        imgClass="saturate-[0.85]"
                                        veil="bg-royal-deep/8"
                                    />

                                    <h3 className="mt-10 font-display text-[clamp(1.625rem,2.2vw,2.25rem)] leading-none font-bold tracking-tight text-royal">
                                        {person.name}
                                    </h3>

                                    <p className="eyebrow mt-5 text-gold-dark">{person.title}</p>

                                    {person.quote ? (
                                        <figure className="mt-10">
                                            <blockquote>
                                                <p className="max-w-[32ch] font-display text-[clamp(1.25rem,1.7vw,1.625rem)] leading-[1.42] font-medium text-balance text-royal">
                                                    &ldquo;{person.quote}&rdquo;
                                                </p>
                                            </blockquote>
                                        </figure>
                                    ) : null}

                                    <p className="mt-10 max-w-[52ch] border-t border-line pt-10 text-[15px] leading-[1.9] text-ink-muted">
                                        {person.bio}
                                    </p>
                                </Rise>
                            ))}
                        </div>

                        {principals.cta?.path ? (
                            <Rise>
                                <ArrowLink href={principals.cta.path} className="mt-20">
                                    {principals.cta.label}
                                </ArrowLink>
                            </Rise>
                        ) : null}
                    </Stagger>
                </section>
            ) : null}

            {/* ========================= LEADERSHIP TEAM ========================= */}
            {executiveTeam.length ? (
                <section aria-labelledby="leadership-heading" className="border-t border-line bg-surface">
                    <div className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                        <Stagger>
                            <SectionHeading
                                id="leadership-heading"
                                eyebrow={executives.heading?.eyebrow}
                                title={executives.heading?.title}
                                titleClass="max-w-[22ch]"
                            />
                        </Stagger>

                        <Stagger
                            margin="-80px"
                            className="mt-16 grid gap-x-8 gap-y-16 md:grid-cols-3 lg:mt-20 lg:gap-x-12"
                        >
                            {executiveTeam.map((person) => (
                                <Rise as="article" key={person.key} className="border-t border-line pt-8">
                                    <Plate
                                        image={person.photo}
                                        alt={person.photo?.alt || `${person.name}, ${person.title}`}
                                        ratio="aspect-4/5"
                                        sizes="(min-width: 48rem) 30vw, 100vw"
                                        quality={85}
                                        imgClass="saturate-[0.82]"
                                        veil="bg-royal-deep/8"
                                    />

                                    <h3 className="mt-8 text-[19px] leading-snug font-bold text-royal">{person.name}</h3>
                                    <p className="eyebrow mt-3.5 text-gold-dark">{person.title}</p>
                                    <p className="mt-6 max-w-[38ch] text-[14px] leading-[1.8] text-ink-muted">
                                        {person.bio}
                                    </p>
                                </Rise>
                            ))}
                        </Stagger>
                    </div>
                </section>
            ) : null}

            {/* ============================ GOVERNANCE ============================ */}
            <section
                id="governance"
                aria-labelledby="governance-heading"
                className="border-t border-line bg-surface-soft"
            >
                <Stagger className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                    <SplitHeading
                        id="governance-heading"
                        eyebrow={governance.heading?.eyebrow}
                        title={governance.heading?.title}
                        intro={governance.heading?.intro}
                    />

                    {/* Hairline clause rows — the register of a governance
                        statement, not a card grid. */}
                    <dl className="mt-20 lg:mt-24">
                        {(governance.clauses ?? []).map((clause, index) => (
                            <Rise
                                key={itemKey(clause, index)}
                                className="grid gap-x-8 gap-y-4 border-t border-line py-9 lg:grid-cols-12 lg:gap-x-20 lg:py-11"
                            >
                                <dt className="text-[17px] font-bold text-royal lg:col-span-4">{clause.title}</dt>
                                <dd className="max-w-[64ch] text-[14px] leading-[1.85] text-ink-muted lg:col-span-7 lg:col-start-6">
                                    {clause.detail}
                                </dd>
                            </Rise>
                        ))}
                    </dl>

                    {/* Non-executive roster. Text only: headshots would give the
                        board the same weight as the operating leadership. */}
                    {boardMembers.length ? (
                        <Rise id="board" className="mt-20 border-t border-line pt-12 lg:mt-24">
                            <p className="eyebrow text-ink-muted">{board.heading?.eyebrow}</p>

                            <div className="mt-10 grid gap-x-8 gap-y-10 lg:grid-cols-2 lg:gap-x-20">
                                {boardMembers.map((member) => (
                                    <div key={member.key}>
                                        <p className="text-[17px] font-bold text-royal">{member.name}</p>
                                        <p className="eyebrow mt-3 text-gold-dark">{member.title}</p>
                                        <p className="mt-5 max-w-[52ch] text-[14px] leading-[1.8] text-ink-muted">
                                            {member.bio}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Rise>
                    ) : null}

                    {governance.footnote ? (
                        <Rise
                            as="p"
                            className="mt-16 max-w-[64ch] border-t border-line pt-8 text-[13px] leading-relaxed text-ink-muted"
                        >
                            {governance.footnote}
                        </Rise>
                    ) : null}
                </Stagger>
            </section>
        </>
    );
}
