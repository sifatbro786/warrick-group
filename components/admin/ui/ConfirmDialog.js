"use client";

import { useState, useTransition } from "react";
import { AlertDialog } from "radix-ui";
import { buttonClass } from "./Button";
import { LoaderCircle } from "lucide-react";
import { toastResult } from "./toast";

/**
 * Confirmation for destructive or session-ending actions.
 * `onConfirm` returns an action result ({ status, message }); errors keep
 * the dialog open, success closes it and toasts.
 *
 *   <ConfirmDialog trigger={<Button …/>} title="…" confirmLabel="Delete" onConfirm={() => action(id)} />
 */
export default function ConfirmDialog({
    trigger,
    title,
    description,
    confirmLabel = "Confirm",
    tone = "danger",
    onConfirm,
    open: controlledOpen,
    onOpenChange,
}) {
    const [localOpen, setLocalOpen] = useState(false);
    const open = controlledOpen ?? localOpen;
    const setOpen = onOpenChange ?? setLocalOpen;
    const [pending, startTransition] = useTransition();

    const confirm = (event) => {
        event.preventDefault(); // keep open until the action settles
        startTransition(async () => {
            const result = await onConfirm();
            if (toastResult(result)) setOpen(false);
        });
    };

    return (
        <AlertDialog.Root open={open} onOpenChange={(next) => !pending && setOpen(next)}>
            {trigger ? <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger> : null}
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="admin-overlay fixed inset-0 z-50 bg-royal-night/50 backdrop-blur-[2px]" />
                <AlertDialog.Content className="admin-pop fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-6 shadow-premium-lg focus:outline-none">
                    <AlertDialog.Title className="text-[16px] font-semibold text-royal">{title}</AlertDialog.Title>
                    <AlertDialog.Description className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
                        {description}
                    </AlertDialog.Description>
                    <div className="mt-6 flex justify-end gap-2">
                        <AlertDialog.Cancel className={buttonClass({ variant: "secondary" })} disabled={pending}>
                            Cancel
                        </AlertDialog.Cancel>
                        <AlertDialog.Action
                            className={buttonClass({ variant: tone === "danger" ? "danger" : "primary" })}
                            onClick={confirm}
                            disabled={pending}
                        >
                            {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                            {confirmLabel}
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
}
