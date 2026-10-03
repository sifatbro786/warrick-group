"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Ellipsis, ExternalLink, FileText, ImageOff, Pencil, Trash2 } from "lucide-react";
import { deleteItemAction, reorderAction, setPublishedAction } from "@/server/actions/cms";
import { COLLECTION_SPECS } from "@/server/validators/cms";
import Button from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { Menu, MenuItem, MenuSeparator } from "@/components/admin/ui/Menu";
import { toastResult } from "@/components/admin/ui/toast";
import { formatDate } from "@/lib/admin/format";
import { cn } from "@/lib/cn";

/**
 * Index table for a collection: thumbnail, title, meta, visibility switch,
 * up/down reordering (optimistic; one request writes the whole order) and
 * a row menu. Reordering is off while a search filters the list.
 *
 * @param {{ kind: string, items: object[], canDelete: boolean, filtered?: boolean }} props
 */
export default function CollectionList({ kind, items, canDelete, filtered = false }) {
    const spec = COLLECTION_SPECS[kind];
    const [rows, setOptimisticRows] = useOptimistic(items);
    const [pending, startTransition] = useTransition();
    const canReorder = spec.orderable && !filtered;

    const move = (from, to) => {
        const next = [...rows];
        const [row] = next.splice(from, 1);
        next.splice(to, 0, row);
        startTransition(async () => {
            setOptimisticRows(next);
            toastResult(await reorderAction(kind, next.map((r) => r._id)));
        });
    };

    return (
        <ul className={cn("divide-y divide-line", pending && "cursor-progress")}>
            {rows.map((row, index) => (
                <Row
                    key={row._id}
                    spec={spec}
                    kind={kind}
                    row={row}
                    index={index}
                    count={rows.length}
                    canReorder={canReorder}
                    canDelete={canDelete}
                    onMove={move}
                    busy={pending}
                />
            ))}
        </ul>
    );
}

function Row({ spec, kind, row, index, count, canReorder, canDelete, onMove, busy }) {
    const { title, subtitle, image, meta = [] } = spec.list;
    const href = `/admin/${kind}/${row._id}`;
    const [confirming, setConfirming] = useState(false);
    const live = spec.publish ? row[spec.publish.field] === spec.publish.on : true;
    const viewHref = spec.view && live ? spec.view(row) : null;

    return (
        <li className="group relative flex items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-soft sm:gap-4 sm:px-5">
            {canReorder ? (
                <div className="flex shrink-0 flex-col">
                    <MoveButton label="Move up" icon={ArrowUp} disabled={busy || index === 0} onClick={() => onMove(index, index - 1)} />
                    <MoveButton label="Move down" icon={ArrowDown} disabled={busy || index === count - 1} onClick={() => onMove(index, index + 1)} />
                </div>
            ) : null}

            {image ? <Thumb image={row[image]} /> : kind === "reports" ? <FileThumb /> : null}

            <div className="min-w-0 flex-1">
                <Link
                    href={href}
                    className={cn(
                        "block truncate text-[14px] font-medium after:absolute after:inset-0 focus-visible:outline-none",
                        live ? "text-royal" : "text-ink-muted",
                    )}
                >
                    {row[title] || "Untitled"}
                </Link>
                {subtitle && row[subtitle] ? <p className="truncate text-[12.5px] text-ink-muted">{row[subtitle]}</p> : null}
                {meta.length ? (
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted">
                        {meta.map((key) => (
                            <Meta key={key} name={key} value={row[key]} />
                        ))}
                    </p>
                ) : null}
            </div>

            {spec.publish ? <PublishSwitch kind={kind} spec={spec} row={row} /> : null}

            <div className="relative z-10 shrink-0">
                <Menu
                    trigger={
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${row[title]}`}>
                            <Ellipsis aria-hidden="true" />
                        </Button>
                    }
                >
                    <MenuItem icon={Pencil} href={href}>
                        Edit
                    </MenuItem>
                    {viewHref ? (
                        <MenuItem icon={ExternalLink} href={viewHref} external>
                            View on site
                        </MenuItem>
                    ) : null}
                    {canDelete ? (
                        <>
                            <MenuSeparator />
                            <MenuItem icon={Trash2} tone="danger" onSelect={() => setConfirming(true)}>
                                Delete
                            </MenuItem>
                        </>
                    ) : null}
                </Menu>
            </div>

            <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title={`Delete “${row[title]}”?`}
                description="It disappears from the site immediately. This can't be undone."
                confirmLabel="Delete"
                onConfirm={() => deleteItemAction(kind, row._id)}
            />
        </li>
    );
}

function PublishSwitch({ kind, spec, row }) {
    const initial = row[spec.publish.field] === spec.publish.on;
    const [on, setOn] = useOptimistic(initial);
    const [pending, startTransition] = useTransition();

    const toggle = () =>
        startTransition(async () => {
            setOn(!on);
            toastResult(await setPublishedAction(kind, row._id, !on));
        });

    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={`${on ? spec.publish.onLabel : spec.publish.offLabel} — ${row[spec.list.title]}`}
            onClick={toggle}
            disabled={pending}
            className="relative z-10 hidden shrink-0 items-center gap-2 rounded-md px-2 py-1 text-[12.5px] transition-colors hover:bg-surface-card disabled:opacity-60 sm:flex"
        >
            <span
                aria-hidden="true"
                className={cn(
                    "relative h-4 w-7 rounded-full transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-3 after:rounded-full after:bg-white after:transition-transform after:content-['']",
                    on ? "bg-royal after:translate-x-3" : "bg-line",
                )}
            />
            <span className={cn("w-16 text-left", on ? "text-ink" : "text-ink-muted")}>{on ? spec.publish.onLabel : spec.publish.offLabel}</span>
        </button>
    );
}

function MoveButton({ label, icon: Icon, ...props }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className="relative z-10 flex size-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-surface-card hover:text-royal disabled:pointer-events-none disabled:opacity-25"
            {...props}
        >
            <Icon className="size-3.5" aria-hidden="true" />
        </button>
    );
}

function Thumb({ image }) {
    return (
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-card sm:h-12 sm:w-16">
            {image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: image.focal || "center" }} />
            ) : (
                <ImageOff className="size-4 text-ink-muted/60" aria-hidden="true" />
            )}
        </span>
    );
}

function FileThumb() {
    return (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface-card">
            <FileText className="size-4 text-royal" aria-hidden="true" />
        </span>
    );
}

const LABELS = {
    type: { executive: "Executive", board: "Board", operating: "Operating", parent: "Parent" },
    stage: { research: "Research", pilot: "Pilot", scaling: "Scaling" },
};

function Meta({ name, value }) {
    if (value === undefined || value === null || value === "") return null;
    if (name === "isHeadquarters") return value ? <Badge tone="gold">Head office</Badge> : null;
    if (name === "publishedAt") return <span>{formatDate(value)}</span>;
    if (name === "slug" || name === "key") return <span className="font-mono text-[11.5px]">{value}</span>;
    if (name === "fileUrl") {
        const uploaded = String(value).startsWith("/uploads/");
        return (
            <span className={cn("truncate font-mono text-[11.5px]", !uploaded && "text-gold-dark")} title={value}>
                {uploaded ? "Uploaded PDF" : `Linked: ${value}`}
            </span>
        );
    }
    return <span>{LABELS[name]?.[value] ?? value}</span>;
}
