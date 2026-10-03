"use client";

import { useWatch } from "react-hook-form";

/**
 * Approximate Google result for the values being edited. Lengths are cut
 * where Google usually cuts them (~60 / ~160 characters), so an editor sees
 * the truncation before it ships.
 *
 * @param {{ url: string, fallbackTitle: string, fallbackDescription: string,
 *           template?: string, absolute?: boolean, titleName?: string, descriptionName?: string }} props
 */
export default function SerpPreview({
    url,
    fallbackTitle,
    fallbackDescription,
    template,
    absolute = false,
    titleName = "title",
    descriptionName = "description",
}) {
    const title = useWatch({ name: titleName });
    const description = useWatch({ name: descriptionName });

    const raw = String(title || "").trim() || fallbackTitle || "";
    const full = absolute || !template?.includes("%s") ? raw : template.replace("%s", raw);
    const text = String(description || "").trim() || fallbackDescription || "";

    let host = url;
    try {
        const parsed = new URL(url);
        host = `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname.replace(/\//g, " › ").replace(/^ › /, " › ")}`;
    } catch {
        /* keep as typed */
    }

    return (
        <figure className="mb-6 rounded-md border border-line bg-surface-soft px-4 py-4">
            <figcaption className="eyebrow mb-3 !text-[10px] text-ink-muted">Search preview</figcaption>
            <div className="max-w-[600px] font-[arial,sans-serif]">
                <p className="truncate text-[12px] text-[#4d5156]">{host}</p>
                <p className="mt-1 truncate text-[19px] leading-snug text-[#1a0dab]">{cut(full, 62) || "Untitled"}</p>
                <p className="mt-1 line-clamp-2 text-[13.5px] leading-[1.55] text-[#4d5156]">{cut(text, 160) || "No description — Google will pick text from the page."}</p>
            </div>
        </figure>
    );
}

const cut = (value, max) => (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value);
