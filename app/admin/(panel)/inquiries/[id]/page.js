import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, TriangleAlert } from "lucide-react";
import { requireUser } from "@/server/auth/dal";
import { getInquiry } from "@/server/services/inquiry-admin";
import { objectId } from "@/server/validators/_shared";
import { Panel } from "@/components/admin/ui/Panel";
import Badge, { INQUIRY_STATUS } from "@/components/admin/ui/Badge";
import InquiryActions from "@/components/admin/inquiries/InquiryActions";
import { formatDateTime } from "@/lib/admin/format";

export const metadata = { title: "Inquiry" };

export default async function InquiryPage({ params }) {
    const user = await requireUser();
    const { id } = await params;
    if (!objectId.safeParse(id).success) notFound();

    const inquiry = await getInquiry(id);
    if (!inquiry) notFound();

    /* Opening it marks it read (client side); show it as read already. */
    const status = inquiry.status === "new" ? "read" : inquiry.status;

    return (
        <>
            <Link
                href="/admin/inquiries"
                className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-royal"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Inbox
            </Link>

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="eyebrow text-gold-dark">{inquiry.inquiryLabel}</p>
                    <h1 className="mt-2 text-[24px] leading-tight font-semibold break-words text-royal lg:text-[28px]">
                        {inquiry.subject}
                    </h1>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
                        <span className="font-mono text-[12px]">{inquiry.reference}</span>
                        <Badge tone={INQUIRY_STATUS[status].tone}>{INQUIRY_STATUS[status].label}</Badge>
                    </p>
                </div>
            </div>

            <div className="mb-6">
                <InquiryActions
                    inquiry={{
                        id: String(inquiry._id),
                        status: inquiry.status,
                        reference: inquiry.reference,
                        subject: inquiry.subject,
                        email: inquiry.email,
                        fullName: inquiry.fullName,
                    }}
                    canDelete={user.isSuperAdmin}
                />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <Panel className="px-5 py-5 sm:px-7 sm:py-6">
                    <h2 className="sr-only">Message</h2>
                    {/* Plain text, rendered as text: nothing the visitor typed is ever HTML. */}
                    <p className="text-[14.5px] leading-[1.75] break-words whitespace-pre-wrap text-ink">{inquiry.message}</p>
                </Panel>

                <aside className="space-y-6">
                    <Panel>
                        <dl className="divide-y divide-line text-[13.5px]">
                            <Row label="From">
                                <span className="block font-medium text-ink">{inquiry.fullName}</span>
                                <a href={`mailto:${inquiry.email}`} className="break-all text-royal-light hover:text-royal">
                                    {inquiry.email}
                                </a>
                            </Row>
                            <Row label="Desk">{inquiry.inquiryLabel}</Row>
                            <Row label="Received">{formatDateTime(inquiry.createdAt)}</Row>
                        </dl>
                    </Panel>

                    <Panel>
                        <h2 className="border-b border-line px-5 py-3 text-[13px] font-semibold text-royal">Email delivery</h2>
                        <ul className="space-y-2.5 px-5 py-4 text-[13px]">
                            <Delivery label="Desk notified" at={inquiry.mail?.deskNotifiedAt} />
                            <Delivery label="Sender acknowledged" at={inquiry.mail?.acknowledgedAt} />
                        </ul>
                        {inquiry.mail?.error ? (
                            <p className="mx-5 mb-4 rounded-md bg-[#9b2c2c]/5 px-3 py-2 text-[12px] leading-relaxed break-words text-[#9b2c2c]">
                                {inquiry.mail.error}
                            </p>
                        ) : null}
                    </Panel>
                </aside>
            </div>
        </>
    );
}

function Row({ label, children }) {
    return (
        <div className="px-5 py-3">
            <dt className="text-[12px] text-ink-muted">{label}</dt>
            <dd className="mt-0.5 text-ink">{children}</dd>
        </div>
    );
}

function Delivery({ label, at }) {
    return (
        <li className="flex items-start gap-2">
            {at ? (
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#2f6b45]" aria-hidden="true" />
            ) : (
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gold-dark" aria-hidden="true" />
            )}
            <span>
                <span className="text-ink">{label}</span>
                <span className="block text-[12px] text-ink-muted">{at ? formatDateTime(at) : "Not sent"}</span>
            </span>
        </li>
    );
}
