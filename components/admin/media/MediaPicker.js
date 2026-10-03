"use client";

import { useEffect, useState, useTransition } from "react";
import { Tabs } from "radix-ui";
import { Check, ChevronLeft, ChevronRight, FileText, LoaderCircle, Search } from "lucide-react";
import { listMediaAction } from "@/server/actions/media";
import { SAFE_SRC } from "@/server/validators/patterns";
import Modal from "@/components/admin/ui/Modal";
import Button from "@/components/admin/ui/Button";
import { Field, Input } from "@/components/admin/ui/Form";
import { cn } from "@/lib/cn";
import Dropzone from "./Dropzone";
import { formatBytes } from "./uploadFile";

/**
 * Choose a file: from the library, by uploading, or by pasting a URL.
 * onSelect receives `{ url, alt?, size? }`.
 *
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, accept?: "image"|"document",
 *           onSelect: (choice: { url: string, alt?: string, size?: number }) => void }} props
 */
export default function MediaPicker({ open, onOpenChange, accept = "image", onSelect }) {
    const choose = (choice) => {
        onSelect(choice);
        onOpenChange(false);
    };

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title={accept === "document" ? "Choose a document" : "Choose an image"}
            className="max-w-3xl"
        >
            {open ? (
                <Tabs.Root defaultValue="library">
                    <Tabs.List className="-mt-2 mb-5 flex gap-1 border-b border-line" aria-label="Source">
                        {[
                            ["library", "Library"],
                            ["upload", "Upload"],
                            ["link", "Paste a URL"],
                        ].map(([value, label]) => (
                            <Tabs.Trigger
                                key={value}
                                value={value}
                                className="-mb-px border-b-2 border-transparent px-3 py-2.5 text-[13.5px] text-ink-muted transition-colors hover:text-royal data-[state=active]:border-gold data-[state=active]:font-medium data-[state=active]:text-royal"
                            >
                                {label}
                            </Tabs.Trigger>
                        ))}
                    </Tabs.List>
                    <Tabs.Content value="library" className="focus:outline-none">
                        <Library accept={accept} onChoose={choose} />
                    </Tabs.Content>
                    <Tabs.Content value="upload" className="focus:outline-none">
                        <Dropzone
                            accept={accept}
                            onUploaded={(media) => choose({ url: media.url, alt: media.alt, size: media.size })}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="link" className="focus:outline-none">
                        <LinkTab onChoose={choose} />
                    </Tabs.Content>
                </Tabs.Root>
            ) : null}
        </Modal>
    );
}

function Library({ accept, onChoose }) {
    const [query, setQuery] = useState({ q: "", page: 1 });
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [selected, setSelected] = useState(null);
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        let live = true;
        startTransition(async () => {
            const result = await listMediaAction({ kind: accept, q: query.q || undefined, page: query.page });
            if (live) setData(result);
        });
        return () => {
            live = false;
        };
    }, [accept, query]);

    /* Debounced search. */
    useEffect(() => {
        const t = setTimeout(() => setQuery((prev) => (prev.q === search ? prev : { q: search, page: 1 })), 300);
        return () => clearTimeout(t);
    }, [search]);

    const items = data?.items ?? [];

    return (
        <div>
            <div className="relative mb-4">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by file name or alt text"
                    aria-label="Search the library"
                    className="h-9 pl-9"
                    maxLength={100}
                />
            </div>

            {data === null ? (
                <div className="flex h-48 items-center justify-center text-ink-muted">
                    <LoaderCircle className="size-5 animate-spin" aria-label="Loading" />
                </div>
            ) : items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line px-6 py-12 text-center text-[13px] text-ink-muted">
                    {query.q ? "Nothing matches that search." : "The library is empty. Upload a file from the Upload tab."}
                </p>
            ) : (
                <ul
                    className={cn(
                        "grid gap-3",
                        accept === "document" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
                        pending && "opacity-60",
                    )}
                >
                    {items.map((item) => {
                        const active = selected?._id === item._id;
                        return (
                            <li key={item._id}>
                                <button
                                    type="button"
                                    onClick={() => setSelected(item)}
                                    onDoubleClick={() => onChoose({ url: item.url, alt: item.alt, size: item.size })}
                                    aria-pressed={active}
                                    className={cn(
                                        "group relative block w-full overflow-hidden rounded-md border text-left transition-[border-color,box-shadow]",
                                        active ? "border-royal shadow-[0_0_0_2px_rgb(46_26_71/0.25)]" : "border-line hover:border-royal/30",
                                    )}
                                >
                                    {item.kind === "image" ? (
                                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an arbitrary upload
                                        <img src={item.url} alt="" loading="lazy" className="aspect-4/3 w-full bg-surface-card object-cover" />
                                    ) : (
                                        <span className="flex items-center gap-3 px-3 py-3">
                                            <FileText className="size-5 shrink-0 text-royal" aria-hidden="true" />
                                            <span className="min-w-0 truncate text-[13px] text-ink">{item.originalName || item.key}</span>
                                        </span>
                                    )}
                                    <span className="block truncate border-t border-line px-2.5 py-1.5 text-[11.5px] text-ink-muted">
                                        {item.kind === "image" && item.width ? `${item.width}×${item.height} · ` : ""}
                                        {formatBytes(item.size)}
                                    </span>
                                    {active ? (
                                        <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-royal text-white">
                                            <Check className="size-3.5" aria-hidden="true" />
                                        </span>
                                    ) : null}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Pager
                    page={query.page}
                    pages={data?.pages ?? 1}
                    onPage={(page) => setQuery((prev) => ({ ...prev, page }))}
                />
                <Button disabled={!selected} onClick={() => onChoose({ url: selected.url, alt: selected.alt, size: selected.size })}>
                    Use selected
                </Button>
            </div>
        </div>
    );
}

function Pager({ page, pages, onPage }) {
    if (pages <= 1) return <span />;
    return (
        <div className="flex items-center gap-2 text-[13px] text-ink-muted">
            <Button variant="ghost" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                <ChevronLeft aria-hidden="true" />
            </Button>
            <span className="tabular-nums">
                {page} / {pages}
            </span>
            <Button variant="ghost" size="icon" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}>
                <ChevronRight aria-hidden="true" />
            </Button>
        </div>
    );
}

function LinkTab({ onChoose }) {
    const [value, setValue] = useState("");
    const [error, setError] = useState(null);

    const submit = () => {
        const url = value.trim();
        if (!SAFE_SRC.test(url)) {
            setError("Use a full https:// address or a site path starting with /.");
            return;
        }
        onChoose({ url });
    };

    return (
        <div className="space-y-4">
            <Field
                label="Address"
                htmlFor="mp-url"
                error={error}
                hint="An https:// image address, or a file already on the site such as /logo.png. Remote images must be on an allowed host (next.config.mjs)."
            >
                <Input
                    id="mp-url"
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setError(null);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            submit();
                        }
                    }}
                    placeholder="https://…"
                    spellCheck={false}
                    aria-invalid={error ? true : undefined}
                />
            </Field>
            <div className="flex justify-end">
                <Button onClick={submit}>Use this address</Button>
            </div>
        </div>
    );
}
