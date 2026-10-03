"use client";

import { useTransition } from "react";
import { Mail } from "lucide-react";
import { sendTestEmailAction } from "@/server/actions/mail";
import Button from "@/components/admin/ui/Button";
import { toastResult } from "@/components/admin/ui/toast";

/** Sends a test message to the signed-in admin and toasts the outcome. */
export default function MailTest({ email, disabled }) {
    const [pending, startTransition] = useTransition();
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button
                variant="secondary"
                pending={pending}
                disabled={disabled}
                onClick={() => startTransition(async () => toastResult(await sendTestEmailAction()))}
            >
                <Mail aria-hidden="true" />
                Send a test email
            </Button>
            <span className="min-w-0 text-[12.5px] break-all text-ink-muted">Goes to {email}</span>
        </div>
    );
}
