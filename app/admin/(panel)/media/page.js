import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/server/auth/dal";
import { listMedia } from "@/server/services/media";
import { editorContext } from "@/server/services/cms-context";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui/Panel";
import Button, { buttonClass } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Form";
import MediaLibrary from "@/components/admin/media/MediaLibrary";
import { cn } from "@/lib/cn";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export const metadata = { title: "Media" };

const querySchema = z.object({
    kind: z.enum(["image", "document"]).optional().catch(undefined),
    q: z.string().trim().max(100).optional().catch(undefined),
    page: z.coerce.number().int().min(1).max(1000).catch(1),
});

const TABS = [
    { kind: undefined, label: "All" },
    { kind: "image", label: "Images" },
    { kind: "document", label: "Documents" },
];

export default async function MediaPage({ searchParams }) {
    const user = await requireUser();
    const raw = await searchParams;
    const query = querySchema.parse({ kind: raw.kind || undefined, q: raw.q || undefined, page: raw.page ?? 1 });
    const [{ items, total, pages }, cms] = await Promise.all([listMedia({ ...query, withUsage: true }), editorContext({})]);

    const href = (patch) => {
        const params = new URLSearchParams();
        const next = { ...query, page: 1, ...patch };
        if (next.kind) params.set("kind", next.kind);
        if (next.q) params.set("q", next.q);
        if (next.page > 1) params.set("page", String(next.page));
        const qs = params.toString();
        return qs ? `/admin/media?${qs}` : "/admin/media";
    };

    return (
        <>
            <PageHeader
                eyebrow="Content"
                title="Media library"
                description="Images and PDFs uploaded from the dashboard. Photos are re-saved without location data and capped at 3000px."
            />

            <Panel className="mb-6">
                <div className="flex flex-col gap-3 px-3 pt-2 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
                    <nav aria-label="File types" className="-mb-px flex gap-1">
                        {TABS.map((tab) => {
                            const active = tab.kind === query.kind;
                            return (
                                <Link
                                    key={tab.label}
                                    href={href({ kind: tab.kind })}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "border-b-2 px-3 py-3 text-[13.5px] whitespace-nowrap transition-colors",
                                        active ? "border-gold font-medium text-royal" : "border-transparent text-ink-muted hover:text-royal",
                                    )}
                                >
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <form action="/admin/media" role="search" className="flex items-center gap-2 pb-3">
                        {query.kind ? <input type="hidden" name="kind" value={query.kind} /> : null}
                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                            <Input type="search" name="q" defaultValue={query.q ?? ""} placeholder="File name or alt text" aria-label="Search media" className="h-9 pl-9" maxLength={100} />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-9">
                            Search
                        </Button>
                    </form>
                </div>
            </Panel>

            <MediaLibrary items={items} canDelete={user.isSuperAdmin} cms={cms} />

            {!items.length ? (
                <Panel>
                    <EmptyState title={query.q ? "Nothing matches that search." : "Nothing uploaded yet."}>
                        {query.q ? null : "Files you upload here, or from any image field, appear in this library."}
                    </EmptyState>
                </Panel>
            ) : null}

            <div className="mt-6 flex items-center justify-between text-[13px] text-ink-muted">
                <span className="tabular-nums">{total} file{total === 1 ? "" : "s"}</span>
                {pages > 1 ? (
                    <span className="flex items-center gap-2">
                        <PageLink href={query.page > 1 ? href({ page: query.page - 1 }) : null} label="Previous page" icon={ChevronLeft} />
                        <span className="tabular-nums">
                            {query.page} / {pages}
                        </span>
                        <PageLink href={query.page < pages ? href({ page: query.page + 1 }) : null} label="Next page" icon={ChevronRight} />
                    </span>
                ) : null}
            </div>
        </>
    );
}

function PageLink({ href, label, icon: Icon }) {
    const className = buttonClass({ variant: "ghost", size: "icon" });
    return href ? (
        <Link href={href} className={className} aria-label={label}>
            <Icon aria-hidden="true" />
        </Link>
    ) : (
        <span className={`${className} pointer-events-none opacity-30`} aria-hidden="true">
            <Icon />
        </span>
    );
}
