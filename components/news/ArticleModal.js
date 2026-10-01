"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import Dialog from "@/components/dialog/Dialog";

/**
 * Wraps the intercepted /news/[slug] route in the shared Dialog. Closing
 * plays the exit animation first, then steps back in history to /news, so
 * the URL, the back button and the visual all agree.
 *
 * With Cache Components the closed route is kept hidden (React Activity)
 * rather than unmounted; the effect cleanup resets `closing` while hidden so
 * reopening the same release shows it again.
 */
export default function ArticleModal({ titleId, children }) {
    const router = useRouter();
    const [closing, setClosing] = useState(false);

    useEffect(() => () => setClosing(false), []);

    return (
        <AnimatePresence onExitComplete={() => router.back()}>
            {closing ? null : (
                <Dialog key="article" labelledBy={titleId} onClose={() => setClosing(true)}>
                    {children}
                </Dialog>
            )}
        </AnimatePresence>
    );
}
