"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import Button from "@/components/admin/ui/Button";

/** Dashboard page failed (DB down, bug). Sidebar stays usable. */
export default function AdminError({ error, retry }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="rounded-lg border border-line bg-surface px-6 py-14 text-center">
            <TriangleAlert className="mx-auto size-6 text-gold-dark" aria-hidden="true" />
            <h1 className="mt-3 text-[18px] font-semibold text-royal">This page couldn&rsquo;t load</h1>
            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-ink-muted">
                The database may be unreachable for a moment. Your work elsewhere is safe.
                {error?.digest ? <span className="mt-2 block text-[12px]">Reference: {error.digest}</span> : null}
            </p>
            <Button className="mt-6" variant="secondary" onClick={() => retry()}>
                Try again
            </Button>
        </div>
    );
}
