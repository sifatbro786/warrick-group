"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Ellipsis, ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { deleteMediaAction, updateMediaAltAction } from "@/server/actions/media";
import Button from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import Modal from "@/components/admin/ui/Modal";
import { Field, Input } from "@/components/admin/ui/Form";
import { Menu, MenuItem, MenuSeparator } from "@/components/admin/ui/Menu";
import { toastResult } from "@/components/admin/ui/toast";
import { CmsProvider } from "@/components/admin/cms/CmsContext";
import { formatDate } from "@/lib/admin/format";
import Dropzone from "./Dropzone";
import { formatBytes } from "./uploadFile";

/**
 * Library grid + uploader. Uploads refresh the server list; usage ("In use")
 * is computed on the server, and delete is refused while a file is used.
 *
 * @param {{ items: object[], canDelete: boolean, cms: object }} props
 */
export default function MediaLibrary({ items, canDelete, cms }) {
    const router = useRouter();

    return (
        <CmsProvider value={cms}>
            <div className="mb-6">
                <Dropzone
                    accept="any"
                    multiple
                    onUploaded={(media) => {
                        toast.success(`Uploaded ${media.originalName || "file"}.`);
                        router.refresh();
                    }}
                />
            </div>

            {items.length ? (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((item) => (
                        <MediaCard key={item._id} item={item} canDelete={canDelete} />
                    ))}
                </ul>
            ) : null}
        </CmsProvider>
    );
}

function MediaCard({ item, canDelete }) {
    const [dialog, setDialog] = useState(null); // "alt" | "delete" | null
    const name = item.originalName || item.key.split("/").pop();

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(item.url);
            toast.success("Address copied.");
        } catch {
            toast.error("Couldn't copy. Open the file and copy the address bar.");
        }
    };

    return (
        <li className="group overflow-hidden rounded-lg border border-line bg-surface">
            <a href={item.url} target="_blank" rel="noopener" className="block bg-surface-card" aria-label={`Open ${name}`}>
                {item.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an upload
                    <img src={item.url} alt={item.alt || ""} loading="lazy" className="aspect-4/3 w-full object-cover" />
                ) : (
                    <span className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 text-royal">
                        <FileText className="size-8" aria-hidden="true" />
                        <span className="text-[11px] font-semibold tracking-[0.12em]">PDF</span>
                    </span>
                )}
            </a>
            <div className="flex items-start gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink" title={name}>
                        {name}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                        {item.width ? `${item.width}×${item.height} · ` : ""}
                        {formatBytes(item.size)} · {formatDate(item.createdAt)}
                    </p>
                    <p className="mt-1.5">{item.inUse ? <Badge tone="success">In use</Badge> : <Badge>Not used</Badge>}</p>
                </div>
                <Menu
                    trigger={
                        <Button variant="ghost" size="icon" className="-mr-1.5 shrink-0" aria-label={`Actions for ${name}`}>
                            <Ellipsis aria-hidden="true" />
                        </Button>
                    }
                >
                    <MenuItem icon={Copy} onSelect={copy}>
                        Copy address
                    </MenuItem>
                    <MenuItem icon={ExternalLink} href={item.url} external>
                        Open
                    </MenuItem>
                    {item.kind === "image" ? (
                        <MenuItem icon={Pencil} onSelect={() => setDialog("alt")}>
                            Default alt text
                        </MenuItem>
                    ) : null}
                    {canDelete ? (
                        <>
                            <MenuSeparator />
                            <MenuItem icon={Trash2} tone="danger" onSelect={() => setDialog("delete")}>
                                Delete
                            </MenuItem>
                        </>
                    ) : null}
                </Menu>
            </div>

            <Modal
                open={dialog === "alt"}
                onOpenChange={(open) => !open && setDialog(null)}
                title="Default alt text"
                description="Filled in when this image is chosen in an editor. Images already placed keep their own text."
            >
                {dialog === "alt" ? <AltForm item={item} onDone={() => setDialog(null)} /> : null}
            </Modal>

            <ConfirmDialog
                open={dialog === "delete"}
                onOpenChange={(open) => !open && setDialog(null)}
                title={`Delete ${name}?`}
                description={
                    item.inUse
                        ? "This file is still used on the site, so it can't be deleted until it's replaced there."
                        : "The file is removed from the server. This can't be undone."
                }
                confirmLabel="Delete"
                onConfirm={() => deleteMediaAction(item._id)}
            />
        </li>
    );
}

function AltForm({ item, onDone }) {
    const [value, setValue] = useState(item.alt ?? "");
    const [error, setError] = useState(null);
    const [pending, setPending] = useState(false);

    const save = async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await updateMediaAltAction(item._id, value);
        setPending(false);
        if (result?.status === "invalid") return setError(result.errors.alt);
        if (toastResult(result)) onDone();
        else setError(null);
    };

    return (
        <form method="post" onSubmit={save} noValidate className="space-y-4">
            <Field label="Alt text" htmlFor="media-alt" error={error}>
                <Input id="media-alt" value={value} onChange={(e) => setValue(e.target.value)} maxLength={300} aria-invalid={error ? true : undefined} />
            </Field>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onDone} disabled={pending}>
                    Cancel
                </Button>
                <Button type="submit" pending={pending}>
                    Save
                </Button>
            </div>
        </form>
    );
}
