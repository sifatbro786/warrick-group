import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search, Tags } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/server/auth/dal";
import { listItems } from "@/server/services/cms";
import { COLLECTION_SPECS } from "@/server/validators/cms";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui/Panel";
import Button, { buttonClass } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Form";
import CollectionList from "@/components/admin/cms/CollectionList";
import { BackLink } from "@/components/admin/cms/Editors";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

const querySchema = z.object({
    q: z.string().trim().max(100).optional().catch(undefined),
    page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export async function generateMetadata({ params }) {
    const { collection } = await params;
    return { title: Object.hasOwn(COLLECTION_SPECS, collection) ? COLLECTION_SPECS[collection].label : "Content" };
}

export default async function CollectionIndex({ params, searchParams }) {
    const user = await requireUser();
    const { collection: kind } = await params;
    if (!Object.hasOwn(COLLECTION_SPECS, kind)) notFound();

    const spec = COLLECTION_SPECS[kind];
    const raw = await searchParams;
    const query = querySchema.parse({ q: raw.q || undefined, page: raw.page ?? 1 });
    const { items, total, pages } = await listItems(kind, query);
    const page = Math.min(query.page, pages);
    const searchable = kind === "articles";

    const href = (patch) => {
        const params = new URLSearchParams();
        const next = { ...query, ...patch };
        if (next.q) params.set("q", next.q);
        if (next.page > 1) params.set("page", String(next.page));
        const qs = params.toString();
        return qs ? `/admin/${kind}?${qs}` : `/admin/${kind}`;
    };

    return (
        <>
            {spec.parent ? <BackLink href={spec.parent.href}>{spec.parent.label}</BackLink> : null}
            <PageHeader
                eyebrow="Content"
                title={spec.label}
                description={spec.description}
                action={
                    <>
                        {kind === "articles" ? (
                            <Link href="/admin/categories" className={buttonClass({ variant: "secondary" })}>
                                <Tags aria-hidden="true" />
                                Categories
                            </Link>
                        ) : null}
                        <Link href={`/admin/${kind}/new`} className={buttonClass()}>
                            <Plus aria-hidden="true" />
                            New {spec.singular}
                        </Link>
                    </>
                }
            />

            <Panel>
                {searchable ? (
                    <form action={`/admin/${kind}`} role="search" className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 sm:px-5">
                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                            <Input
                                type="search"
                                name="q"
                                defaultValue={query.q ?? ""}
                                placeholder={`Search ${spec.label.toLowerCase()}`}
                                aria-label={`Search ${spec.label.toLowerCase()}`}
                                className="h-9 pl-9"
                                maxLength={100}
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-9">
                            Search
                        </Button>
                        {query.q ? (
                            <Link href={`/admin/${kind}`} className={buttonClass({ variant: "ghost", size: "sm", className: "h-9" })}>
                                Clear
                            </Link>
                        ) : null}
                        <span className="ml-auto text-[12.5px] text-ink-muted tabular-nums">{total} total</span>
                    </form>
                ) : null}

                {items.length ? (
                    <CollectionList kind={kind} items={items} canDelete={user.isSuperAdmin} filtered={Boolean(query.q)} />
                ) : (
                    <EmptyState title={query.q ? "Nothing matches that search." : `No ${spec.label.toLowerCase()} yet.`}>
                        {query.q ? null : (
                            <Link href={`/admin/${kind}/new`} className="font-medium text-royal-light hover:text-royal">
                                Create the first {spec.singular}
                            </Link>
                        )}
                    </EmptyState>
                )}

                {pages > 1 ? (
                    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px] text-ink-muted">
                        <span className="tabular-nums">
                            Page {page} of {pages}
                        </span>
                        <span className="flex gap-1">
                            <PageLink href={page > 1 ? href({ page: page - 1 }) : null} label="Previous page" icon={ChevronLeft} />
                            <PageLink href={page < pages ? href({ page: page + 1 }) : null} label="Next page" icon={ChevronRight} />
                        </span>
                    </nav>
                ) : null}
            </Panel>

            {spec.orderable && !query.q ? (
                <p className="mt-4 text-[12.5px] text-ink-muted">The order here is the order on the site. Use the arrows to move a row.</p>
            ) : null}
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
