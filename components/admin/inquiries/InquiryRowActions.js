"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Ellipsis, Mail, MailOpen } from "lucide-react";
import { setInquiryStatusAction } from "@/server/actions/inquiries";
import Button from "@/components/admin/ui/Button";
import { Menu, MenuItem } from "@/components/admin/ui/Menu";
import { toastResult } from "@/components/admin/ui/toast";

/** Per-row quick triage. Opening the inquiry is the row link itself. */
export default function InquiryRowActions({ id, status }) {
    const [pending, startTransition] = useTransition();
    const set = (next) => startTransition(async () => toastResult(await setInquiryStatusAction(id, next)));

    return (
        <Menu
            trigger={
                <Button variant="ghost" size="icon" pending={pending} aria-label="Inquiry actions">
                    {pending ? null : <Ellipsis aria-hidden="true" />}
                </Button>
            }
        >
            {status === "new" ? (
                <MenuItem icon={MailOpen} onSelect={() => set("read")}>
                    Mark as read
                </MenuItem>
            ) : null}
            {status === "read" ? (
                <MenuItem icon={Mail} onSelect={() => set("new")}>
                    Mark as unread
                </MenuItem>
            ) : null}
            {status === "archived" ? (
                <MenuItem icon={ArchiveRestore} onSelect={() => set("read")}>
                    Move to inbox
                </MenuItem>
            ) : (
                <MenuItem icon={Archive} onSelect={() => set("archived")}>
                    Archive
                </MenuItem>
            )}
        </Menu>
    );
}
