import Link from "next/link";
import { ArrowUpRight, Inbox, TriangleAlert } from "lucide-react";
import { requireUser } from "@/server/auth/dal";
import { getOverview } from "@/server/services/dashboard";
import { EmptyState, PageHeader, Panel, PanelHeader } from "@/components/admin/ui/Panel";
import Badge, { INQUIRY_STATUS } from "@/components/admin/ui/Badge";
import { formatRelative } from "@/lib/admin/format";

export const metadata = { title: "Overview" };

/* Fallback wording when an audit entry has no summary. */
const ACTION_LABEL = { login: "signed in" };
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

export default async function OverviewPage() {
    const user = await requireUser();
    const data = await getOverview({ includeUsers: user.isSuperAdmin });
    const firstName = user.name.split(/\s+/)[0];

    const figures = [
        { label: "New inquiries", value: data.inquiries.new, href: "/admin/inquiries?view=new", accent: data.inquiries.new > 0 },
        { label: "Inquiries, last 30 days", value: data.inquiries.last30, href: "/admin/inquiries?view=all" },
        { label: "Awaiting triage", value: data.inquiries.new + data.inquiries.read, href: "/admin/inquiries" },
        user.isSuperAdmin
            ? { label: "Active dashboard users", value: data.activeUsers, href: "/admin/users" }
            : { label: "Archived", value: data.inquiries.archived, href: "/admin/inquiries?view=archived" },
    ];

    const content = [
        ["Operating companies", data.content.businesses],
        ["Published releases", data.content.published, data.content.drafts ? `${data.content.drafts} draft` : null],
        ["Ventures", data.content.ventures],
        ["Leadership profiles", data.content.leaders],
        ["Reports", data.content.reports],
        ["Offices", data.content.offices],
    ];

    return (
        <>
            <PageHeader eyebrow="Overview" title={`Welcome back, ${firstName}`} description="What has come in, and what is live on the site." />

            {data.inquiries.mailFailures > 0 ? (
                <Link
                    href="/admin/inquiries"
                    className="mb-6 flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/[0.07] px-4 py-3 text-[13.5px] text-ink transition-colors hover:bg-gold/[0.11]"
                >
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gold-dark" aria-hidden="true" />
                    <span>
                        <strong className="font-semibold">
                            {data.inquiries.mailFailures} inquir{data.inquiries.mailFailures === 1 ? "y" : "ies"}
                        </strong>{" "}
                        could not be emailed to the desk. They are safe in the inbox — check the SMTP settings.
                    </span>
                </Link>
            ) : null}

            {/* Figures: one ledger strip, divided by hairlines. */}
            <Panel className="grid grid-cols-2 lg:grid-cols-4">
                {figures.map((figure, index) => (
                    <Link
                        key={figure.label}
                        href={figure.href}
                        className={`group relative px-5 py-5 transition-colors hover:bg-surface-soft ${
                            index % 2 ? "border-l border-line" : ""
                        } ${index > 1 ? "border-t border-line lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""}`}
                    >
                        <p className="text-[12.5px] text-ink-muted">{figure.label}</p>
                        <p
                            className={`mt-2 font-display text-[30px] leading-none font-semibold tabular-nums ${
                                figure.accent ? "text-gold-dark" : "text-royal"
                            }`}
                        >
                            {figure.value}
                        </p>
                        <ArrowUpRight
                            className="absolute top-4 right-4 size-4 text-ink-muted/0 transition-colors group-hover:text-ink-muted"
                            aria-hidden="true"
                        />
                    </Link>
                ))}
            </Panel>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <Panel>
                    <PanelHeader
                        title="Latest inquiries"
                        action={
                            <Link href="/admin/inquiries" className="text-[13px] font-medium text-royal-light hover:text-royal">
                                Open inbox
                            </Link>
                        }
                    />
                    {data.recent.length ? (
                        <ul className="divide-y divide-line">
                            {data.recent.map((item) => (
                                <li key={item._id}>
                                    <Link
                                        href={`/admin/inquiries/${item._id}`}
                                        className="flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-surface-soft"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className={`truncate text-[14px] ${item.status === "new" ? "font-semibold text-royal" : "text-ink"}`}>
                                                {item.subject}
                                            </p>
                                            <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                                                {item.fullName} · {item.inquiryLabel}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <Badge tone={INQUIRY_STATUS[item.status].tone}>{INQUIRY_STATUS[item.status].label}</Badge>
                                            <p className="mt-1 text-[12px] text-ink-muted">{formatRelative(item.createdAt)}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState icon={Inbox} title="No inquiries yet">
                            Submissions from the contact page will appear here.
                        </EmptyState>
                    )}
                </Panel>

                <div className="space-y-6">
                    <Panel>
                        <PanelHeader title="Live on the site" />
                        <dl className="divide-y divide-line">
                            {content.map(([label, value, note]) => (
                                <div key={label} className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-[13.5px]">
                                    <dt className="text-ink-muted">{label}</dt>
                                    <dd className="font-medium text-royal tabular-nums">
                                        {value}
                                        {note ? <span className="ml-2 text-[12px] font-normal text-gold-dark">{note}</span> : null}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Recent activity" />
                        {data.activity.length ? (
                            <ol className="space-y-3 px-5 py-4">
                                {data.activity.map((entry) => (
                                    <li key={entry._id} className="text-[13px] leading-snug">
                                        <span className="font-medium text-ink">{entry.actorEmail ?? "System"}</span>{" "}
                                        <span className="text-ink-muted">
                                            {entry.summary ? lowerFirst(entry.summary) : (ACTION_LABEL[entry.action] ?? entry.action)}
                                        </span>
                                        <span className="mt-0.5 block text-[12px] text-ink-muted/80">{formatRelative(entry.createdAt)}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="px-5 py-6 text-[13px] text-ink-muted">Nothing recorded yet.</p>
                        )}
                    </Panel>
                </div>
            </div>
        </>
    );
}
