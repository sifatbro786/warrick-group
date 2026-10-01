"use client";

import { useEffect } from "react";
import ErrorView from "@/components/ErrorView";
import "./globals.css";

/* Last resort: the root layout itself failed (e.g. the database is down and
   site settings cannot load), so this replaces the whole document. It cannot
   rely on the Navbar or any data. Web fonts are skipped on purpose; the
   font stacks fall back to the system UI face. */
export default function GlobalError({ error, retry }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <title>Service Interruption | Warrick Group</title>
                <main className="flex min-h-screen flex-col justify-center bg-surface-soft">
                    <ErrorView digest={error?.digest} onRetry={retry} />
                </main>
            </body>
        </html>
    );
}
