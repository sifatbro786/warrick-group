import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox, Search, TriangleAlert } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/server/auth/dal";
import { INQUIRY_VIEWS, listDesks, listInquiries } from "@/server/services/inquiry-admin";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui/Panel";
import Button, { buttonClass } from "@/components/admin/ui/Button";
import { Input, Select } from "@/components/admin/ui/Form";
import Badge from "@/components/admin/ui/Badge";
import InquiryRowActions from "@/components/admin/inquiries/InquiryRowActions";
import { formatRelative } from "@/lib/admin/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "Inquiries" };

/* Query string is user input: anything odd falls back to the default. */
const querySchema = z.object({
    view: z.enum(INQUIRY_VIEWS).catch("inbox"),
    type: z.string().regex(/^[a-z0-9-]{1,60}$/).optional().catch(undefined),
    q: z.string().trim().max(100).optional().catch(undefined),
    page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

const TABS = [
    { view: "inbox", label: "Inbox" },
    { view: "new", label: "Unread" },
    { view: "archived", label: "Archived" },
    { view: "all", label: "All" },
];

export default async function InquiriesPage({ searchParams }) {
    await requireUser();
    const raw = await searchParams;
    const query = querySchema.parse({
        view: raw.view ?? "inbox",
        type: raw.type || undefined,
        q: raw.q || undefined,
        page: raw.page ?? 1,
    });

    const [{ items, total, pages, counts }, desks] = await Promise.all([listInquiries(query), listDesks()]);
    const page = Math.min(query.page, pages);

    const href = (patch) => {
        const params = new URLSearchParams();
        const next = { ...query, page: 1, ...patch };
        if (next.view !== "inbox") params.set("view", next.view);
        if (next.type) params.set("type", next.type);
        if (next.q) params.set("q", next.q);
        if (next.page > 1) params.set("page", String(next.page));
        const qs = params.toString();
        return qs ? `/admin/inquiries?${qs}` : "/admin/inquiries";
    };

    const tabCount = { inbox: counts.new + counts.read, new: counts.new, archived: counts.archived, all: null };
    const filtered = Boolean(query.q || query.type);

    return (
        <>
            <PageHeader
                eyebrow="Inquiries"
                title="Contact inbox"
                description="Every submission from the contact page, saved before any email is sent."
            />

            <Panel>
                <div className="flex flex-col gap-3 border-b border-line px-3 pt-2 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
                    <nav aria-label="Inquiry views" className="-mb-px flex gap-1 overflow-x-auto">
                        {TABS.map((tab) => {
                            const active = tab.view === query.view;
                            return (
                                <Link
                                    key={tab.view}
                                    href={href({ view: tab.view })}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "flex items-center gap-2 border-b-2 px-3 py-3 text-[13.5px] whitespace-nowrap transition-colors",
                                        active
                                            ? "border-gold font-medium text-royal"
                                            : "border-transparent text-ink-muted hover:text-royal",
                                    )}
                                >
                                    {tab.label}
                                    {tabCount[tab.view] != null ? (
                                        <span className="text-[12px] text-ink-muted tabular-nums">{tabCount[tab.view]}</span>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Plain GET form: works without JS, keeps the URL shareable. */}
                    <form action="/admin/inquiries" className="flex flex-wrap items-center gap-2 px-2 pb-3 sm:px-0" role="search">
                        {query.view !== "inbox" ? <input type="hidden" name="view" value={query.view} /> : null}
                        <div className="relative w-full sm:w-56">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                            <Input
                                type="search"
                                name="q"
                                defaultValue={query.q ?? ""}
                                placeholder="Name, email, subject, ref"
                                aria-label="Search inquiries"
                                className="h-9 pl-9"
                                maxLength={100}
                            />
                        </div>
                        <Select name="type" defaultValue={query.type ?? ""} aria-label="Desk" className="h-9 min-w-36 flex-1 sm:w-auto sm:flex-none">
                            <option value="">All desks</option>
                            {desks.map((desk) => (
                                <option key={desk.key} value={desk.key}>
                                    {desk.label}
                                </option>
                            ))}
                        </Select>
                        <Button type="submit" variant="secondary" size="sm" className="h-9">
                            Apply
                        </Button>
                        {filtered ? (
                            <Link href={href({ q: undefined, type: undefined })} className={buttonClass({ variant: "ghost", size: "sm", className: "h-9" })}>
                                Clear
                            </Link>
                        ) : null}
                    </form>
                </div>

                {items.length ? (
                    <ul className="divide-y divide-line">
                        {items.map((item) => {
                            const unread = item.status === "new";
                            return (
                                <li key={item._id} className="group relative flex items-start gap-3 px-3 py-3.5 transition-colors hover:bg-surface-soft sm:px-5">
                                    <span
                                        aria-hidden="true"
                                        className={cn("mt-2 size-1.5 shrink-0 rounded-full", unread ? "bg-gold" : "bg-transparent")}
                                    />
                                    <div className="grid min-w-0 flex-1 gap-x-6 gap-y-1 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]">
                                        <div className="min-w-0">
                                            <p className={cn("truncate text-[14px]", unread ? "font-semibold text-royal" : "text-ink")}>
                                                {item.fullName}
                                            </p>
                                            <p className="truncate text-[12.5px] text-ink-muted">{item.email}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/admin/inquiries/${item._id}`}
                                                className={cn(
                                                    "block truncate text-[14px] after:absolute after:inset-0 focus-visible:outline-none",
                                                    unread ? "font-semibold text-royal" : "text-ink",
                                                )}
                                            >
                                                {item.subject}
                                                {unread ? <span className="sr-only"> (unread)</span> : null}
                                            </Link>
                                            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
                                                <span>{item.inquiryLabel}</span>
                                                <span className="font-mono text-[11.5px]">{item.reference}</span>
                                                {item.mail?.error ? (
                                                    <span className="inline-flex items-center gap-1 text-[#9b2c2c]">
                                                        <TriangleAlert className="size-3.5" aria-hidden="true" /> Email failed
                                                    </span>
                                                ) : null}
                                                {item.status === "archived" ? <Badge>Archived</Badge> : null}
                                            </p>
                                        </div>
                                        <p className="text-[12.5px] whitespace-nowrap text-ink-muted md:text-right">
                                            {formatRelative(item.createdAt)}
                                        </p>
                                    </div>
                                    {/* Above the stretched link so the menu stays clickable. */}
                                    <div className="relative z-10 -my-1">
                                        <InquiryRowActions id={String(item._id)} status={item.status} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <EmptyState icon={Inbox} title={filtered ? "Nothing matches" : query.view === "archived" ? "Nothing archived" : "Inbox zero"}>
                        {filtered ? "Try another search or desk." : "New submissions from the contact page will land here."}
                    </EmptyState>
                )}

                {pages > 1 ? (
                    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px] text-ink-muted">
                        <span>
                            Page {page} of {pages} · {total} total
                        </span>
                        <span className="flex gap-1">
                            <PageLink href={page > 1 ? href({ page: page - 1 }) : null} label="Previous page" icon={ChevronLeft} />
                            <PageLink href={page < pages ? href({ page: page + 1 }) : null} label="Next page" icon={ChevronRight} />
                        </span>
                    </nav>
                ) : null}
            </Panel>
        </>
    );
}

function PageLink({ href, label, icon: Icon }) {
    if (!href) {
        return (
            <span className={buttonClass({ variant: "secondary", size: "icon", className: "opacity-40" })} aria-hidden="true">
                <Icon />
            </span>
        );
    }
    return (
        <Link href={href} aria-label={label} className={buttonClass({ variant: "secondary", size: "icon" })}>
            <Icon aria-hidden="true" />
        </Link>
    );
}
