import Link from "next/link";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/server/auth/dal";
import { listActivity } from "@/server/services/audit";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui/Panel";
import Button, { buttonClass } from "@/components/admin/ui/Button";
import { Select } from "@/components/admin/ui/Form";
import { formatDateTime, formatRelative } from "@/lib/admin/format";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export const metadata = { title: "Activity" };

const querySchema = z.object({
    entity: z.string().regex(/^[A-Za-z]{1,40}$/).optional().catch(undefined),
    actor: z.string().trim().max(254).optional().catch(undefined),
    page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

/* Readable names for the entity column / filter. */
const ENTITY_LABEL = {
    Page: "Pages",
    Business: "Businesses",
    Article: "Articles",
    NewsCategory: "News categories",
    Leader: "Leadership",
    Venture: "Ventures",
    Report: "Reports",
    Office: "Offices",
    SiteSettings: "Settings",
    SeoSetting: "SEO",
    Media: "Media",
    User: "Users",
    Inquiry: "Inquiries",
};

export default async function ActivityPage({ searchParams }) {
    await requireUser();
    const raw = await searchParams;
    const query = querySchema.parse({ entity: raw.entity || undefined, actor: raw.actor || undefined, page: raw.page ?? 1 });
    const { items, total, pages, entities, actors } = await listActivity(query);
    const page = Math.min(query.page, pages);

    const href = (patch) => {
        const params = new URLSearchParams();
        const next = { ...query, ...patch };
        if (next.entity) params.set("entity", next.entity);
        if (next.actor) params.set("actor", next.actor);
        if (next.page > 1) params.set("page", String(next.page));
        const qs = params.toString();
        return qs ? `/admin/activity?${qs}` : "/admin/activity";
    };

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Activity log"
                description="Every change made from the dashboard, newest first. Entries are kept for a year."
            />

            <Panel>
                <form action="/admin/activity" className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 sm:px-5">
                    <Select name="entity" defaultValue={query.entity ?? ""} aria-label="Area" className="h-9 w-auto min-w-40">
                        <option value="">Everything</option>
                        {entities.map((entity) => (
                            <option key={entity} value={entity}>
                                {ENTITY_LABEL[entity] ?? entity}
                            </option>
                        ))}
                    </Select>
                    <Select name="actor" defaultValue={query.actor ?? ""} aria-label="Person" className="h-9 w-auto min-w-48">
                        <option value="">Everyone</option>
                        {actors.map((actor) => (
                            <option key={actor} value={actor}>
                                {actor}
                            </option>
                        ))}
                    </Select>
                    <Button type="submit" variant="secondary" size="sm" className="h-9">
                        Filter
                    </Button>
                    {query.entity || query.actor ? (
                        <Link href="/admin/activity" className={buttonClass({ variant: "ghost", size: "sm", className: "h-9" })}>
                            Clear
                        </Link>
                    ) : null}
                    <span className="ml-auto text-[12.5px] text-ink-muted tabular-nums">{total} entries</span>
                </form>

                {items.length ? (
                    <ol className="divide-y divide-line">
                        {items.map((entry) => (
                            <li key={String(entry._id)} className="grid gap-x-6 gap-y-1 px-5 py-3 text-[13.5px] sm:grid-cols-[minmax(0,1fr)_9rem]">
                                <div className="min-w-0">
                                    <p className="text-ink">{entry.summary || entry.action}</p>
                                    <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                                        {entry.actorEmail ?? "System"} · {ENTITY_LABEL[entry.entity.split(":")[0]] ?? entry.entity}
                                    </p>
                                </div>
                                <time dateTime={new Date(entry.createdAt).toISOString()} title={formatDateTime(entry.createdAt)} className="text-[12.5px] text-ink-muted sm:text-right">
                                    {formatRelative(entry.createdAt)}
                                </time>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <EmptyState icon={History} title="Nothing recorded for this filter." />
                )}

                {pages > 1 ? (
                    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px] text-ink-muted">
                        <span className="tabular-nums">
                            Page {page} of {pages}
                        </span>
                        <span className="flex gap-1">
                            {page > 1 ? (
                                <Link href={href({ page: page - 1 })} className={buttonClass({ variant: "ghost", size: "icon" })} aria-label="Previous page">
                                    <ChevronLeft aria-hidden="true" />
                                </Link>
                            ) : null}
                            {page < pages ? (
                                <Link href={href({ page: page + 1 })} className={buttonClass({ variant: "ghost", size: "icon" })} aria-label="Next page">
                                    <ChevronRight aria-hidden="true" />
                                </Link>
                            ) : null}
                        </span>
                    </nav>
                ) : null}
            </Panel>
        </>
    );
}
