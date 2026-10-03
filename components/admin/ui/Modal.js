"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Centered dialog for forms (create user, reset password…). Radix handles
 * focus trap, Escape, scroll lock and aria wiring.
 *
 *   <Modal open={open} onOpenChange={setOpen} title="…" description="…">…</Modal>
 */
export default function Modal({ open, onOpenChange, title, description, children, className }) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="admin-overlay fixed inset-0 z-50 bg-royal-night/50 backdrop-blur-[2px]" />
                <Dialog.Content
                    className={cn(
                        "admin-pop fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line bg-surface p-6 shadow-premium-lg focus:outline-none",
                        className,
                    )}
                >
                    <div className="mb-5 pr-8">
                        <Dialog.Title className="text-[17px] font-semibold text-royal">{title}</Dialog.Title>
                        {description ? (
                            <Dialog.Description className="mt-1 text-[13px] text-ink-muted">{description}</Dialog.Description>
                        ) : (
                            <Dialog.Description className="sr-only">{title}</Dialog.Description>
                        )}
                    </div>
                    {children}
                    <Dialog.Close
                        className="absolute top-4 right-4 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-card hover:text-royal"
                        aria-label="Close"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
