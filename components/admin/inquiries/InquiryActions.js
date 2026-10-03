"use client";

import { useEffect, useRef, useTransition } from "react";
import { Archive, ArchiveRestore, Mail, Reply, Trash2 } from "lucide-react";
import { deleteInquiryAction, markInquiryReadAction, setInquiryStatusAction } from "@/server/actions/inquiries";
import Button from "@/components/admin/ui/Button";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { toastResult } from "@/components/admin/ui/toast";

/**
 * Toolbar on the inquiry page. Also marks a new inquiry read once it has
 * actually been opened — done here rather than during render so a prefetch
 * can never mark something read.
 */
export default function InquiryActions({ inquiry, canDelete }) {
    const [pending, startTransition] = useTransition();
    const marked = useRef(false);

    useEffect(() => {
        if (inquiry.status !== "new" || marked.current) return;
        marked.current = true;
        markInquiryReadAction(inquiry.id);
    }, [inquiry.id, inquiry.status]);

    const set = (status) => startTransition(async () => toastResult(await setInquiryStatusAction(inquiry.id, status)));

    const replySubject = `Re: [${inquiry.reference}] ${inquiry.subject}`;
    const mailto = `mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent(replySubject)}`;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
                <a href={mailto}>
                    <Reply aria-hidden="true" />
                    Reply by email
                </a>
            </Button>
            {inquiry.status === "archived" ? (
                <Button variant="secondary" pending={pending} onClick={() => set("read")}>
                    {pending ? null : <ArchiveRestore aria-hidden="true" />}
                    Move to inbox
                </Button>
            ) : (
                <>
                    <Button variant="secondary" pending={pending} onClick={() => set("archived")}>
                        {pending ? null : <Archive aria-hidden="true" />}
                        Archive
                    </Button>
                    <Button variant="ghost" disabled={pending} onClick={() => set("new")}>
                        <Mail aria-hidden="true" />
                        Mark unread
                    </Button>
                </>
            )}
            {canDelete ? (
                <ConfirmDialog
                    trigger={
                        <Button variant="danger-ghost">
                            <Trash2 aria-hidden="true" />
                            Delete
                        </Button>
                    }
                    title="Delete this inquiry?"
                    description={`${inquiry.reference} from ${inquiry.fullName} will be removed permanently. Archive it instead if you may need it later.`}
                    confirmLabel="Delete permanently"
                    onConfirm={() => deleteInquiryAction(inquiry.id)}
                />
            ) : null}
        </div>
    );
}
