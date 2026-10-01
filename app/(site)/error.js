"use client";

import { useEffect } from "react";
import ErrorView from "@/components/ErrorView";

/* Runtime errors inside a public page. The Navbar and Footer stay mounted. */
export default function SiteError({ error, retry }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return <ErrorView digest={error?.digest} onRetry={retry} />;
}
