"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import {
    deleteItemAction,
    saveItemAction,
    savePageAction,
    saveSiteSectionAction,
    setPublishedAction,
} from "@/server/actions/cms";
import { COLLECTION_SPECS, PAGE_SPECS, SITE_SECTIONS } from "@/server/validators/cms";
import Button, { buttonClass } from "@/components/admin/ui/Button";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { toastResult } from "@/components/admin/ui/toast";
import { CmsProvider } from "./CmsContext";
import ContentForm from "./ContentForm";
import { Switch } from "./FieldRenderer";

/**
 * Client wrappers that bind a spec (looked up by key — specs hold RegExps
 * and functions, which can't cross the server→client boundary as props) to
 * its Server Action.
 *
 * `version` is the record's updatedAt when the screen loaded; the action
 * refuses the save if someone else saved in between.
 */

/** @param {{ pageKey: string, doc: object, version: string|null, cms: object }} props */
export function PageEditor({ pageKey, doc, version, cms }) {
    const spec = PAGE_SPECS[pageKey];
    return (
        <CmsProvider value={cms}>
            <ContentForm
                fields={spec.fields}
                doc={doc}
                onSubmit={(values) => savePageAction(pageKey, values, version)}
                extra={
                    <a href={spec.path} target="_blank" rel="noopener" className={buttonClass({ variant: "ghost", className: "hidden sm:inline-flex" })}>
                        <ExternalLink aria-hidden="true" />
                        View page
                    </a>
                }
            />
        </CmsProvider>
    );
}

/**
 * Create (id null) or edit a collection record.
 * @param {{ kind: string, id: string|null, doc: object|null, version: string|null,
 *           published?: boolean, canDelete: boolean, cms: object }} props
 */
export function ItemEditor({ kind, id, doc, version, published: initialPublished, canDelete, cms }) {
    const spec = COLLECTION_SPECS[kind];
    const router = useRouter();
    const ownsPublish = spec.publish && !(spec.publish.field in spec.fields);
    const [published, setPublished] = useState(initialPublished ?? true);
    const [toggling, startToggle] = useTransition();

    const onPublishChange = (next) => {
        setPublished(next);
        if (!id) return; // sent with the create
        startToggle(async () => {
            const result = await setPublishedAction(kind, id, next);
            if (!toastResult(result)) setPublished(!next);
        });
    };

    const viewHref = id && spec.view && doc ? spec.view(doc) : null;
    const isLive = spec.publish ? (spec.publish.field in spec.fields ? doc?.[spec.publish.field] === spec.publish.on : published) : true;

    const extra = (
        <>
            {ownsPublish ? (
                <Switch
                    id={`pub-${kind}`}
                    label={published ? spec.publish.onLabel : spec.publish.offLabel}
                    checked={published}
                    disabled={toggling}
                    onChange={(event) => onPublishChange(event.target.checked)}
                    className="mr-2"
                />
            ) : null}
            {viewHref && isLive ? (
                <a href={viewHref} target="_blank" rel="noopener" className={buttonClass({ variant: "ghost", className: "hidden sm:inline-flex" })}>
                    <ExternalLink aria-hidden="true" />
                    View
                </a>
            ) : null}
            {id && canDelete ? (
                <ConfirmDialog
                    trigger={
                        <Button variant="danger-ghost" aria-label={`Delete this ${spec.singular}`}>
                            <Trash2 aria-hidden="true" />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                    }
                    title={`Delete this ${spec.singular}?`}
                    description="It disappears from the site immediately. This can't be undone."
                    confirmLabel="Delete"
                    onConfirm={async () => {
                        const result = await deleteItemAction(kind, id);
                        if (result?.status === "success") router.push(`/admin/${kind}`);
                        return result;
                    }}
                />
            ) : null}
        </>
    );

    return (
        <CmsProvider value={cms}>
            <ContentForm
                fields={spec.fields}
                doc={doc ?? spec.defaults ?? {}}
                onSubmit={(values) => saveItemAction(kind, id, values, { version, published: ownsPublish ? published : undefined })}
                onSaved={(result) => {
                    if (!id && result?.id) router.replace(`/admin/${kind}/${result.id}`);
                }}
                submitLabel={id ? "Save changes" : `Create ${spec.singular}`}
                alwaysEnabled={!id}
                extra={extra}
            />
        </CmsProvider>
    );
}

/** @param {{ sectionKey: string, doc: object, cms: object }} props */
export function SiteSectionEditor({ sectionKey, doc, cms }) {
    const section = SITE_SECTIONS[sectionKey];
    return (
        <CmsProvider value={cms}>
            <ContentForm
                layout="inline"
                fields={section.fields}
                doc={doc}
                onSubmit={(values) => saveSiteSectionAction(sectionKey, values)}
                submitLabel={`Save ${section.label.toLowerCase()}`}
            />
        </CmsProvider>
    );
}

/** "← Businesses" link above an editor. */
export function BackLink({ href, children }) {
    return (
        <Link href={href} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-royal">
            <span aria-hidden="true">←</span> {children}
        </Link>
    );
}
