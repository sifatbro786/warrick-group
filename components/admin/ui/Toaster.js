"use client";

import { Toaster as Sonner } from "sonner";

/** One toaster for the dashboard, styled to the brand. */
export default function Toaster() {
    return (
        <Sonner
            position="top-right"
            closeButton
            toastOptions={{
                classNames: {
                    toast: "!rounded-lg !border-line !bg-surface !text-ink !shadow-premium !font-sans",
                    title: "!text-[13.5px] !font-medium",
                    description: "!text-ink-muted",
                    success: "[&_[data-icon]]:!text-[#2f6b45]",
                    error: "[&_[data-icon]]:!text-[#9b2c2c]",
                },
            }}
        />
    );
}
