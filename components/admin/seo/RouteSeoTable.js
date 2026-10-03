"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { saveRouteSeoAction } from "@/server/actions/cms";
import { ROUTE_SEO_FIELDS } from "@/server/validators/cms";
import Button from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import { CmsProvider } from "@/components/admin/cms/CmsContext";
import ContentForm from "@/components/admin/cms/ContentForm";
import SerpPreview from "./SerpPreview";

/**
 * One row per public route with a quick health read, and an editor dialog
 * with a live search preview.
 *
 * @param {{ routes: object[], defaults: { title: string, description: string, template: string }, siteUrl: string, cms: object }} props
 */
export default function RouteSeoTable({ routes, defaults, siteUrl, cms }) {
    const [editing, setEditing] = useState(null);

    return (
        <CmsProvider value={cms}>
            <ul className="divide-y divide-line">
                {routes.map((route) => (
                    <li key={route._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                        <div className="min-w-0 flex-1 basis-64">
                            <p className="flex items-baseline gap-3 text-[14px] font-medium text-royal">
                                {route.label}
                                <span className="font-mono text-[12px] font-normal text-ink-muted">{route.path}</span>
                            </p>
                            <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">{route.title || <em>Uses the default title</em>}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {health(route).map(([tone, label]) => (
                                <Badge key={label} tone={tone}>
                                    {label}
                                </Badge>
                            ))}
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setEditing(route)}>
                            <Pencil aria-hidden="true" />
                            Edit
                        </Button>
                    </li>
                ))}
            </ul>

            <Modal
                open={Boolean(editing)}
                onOpenChange={(open) => !open && setEditing(null)}
                title={editing ? `SEO — ${editing.label}` : "SEO"}
                description={editing?.path}
                className="max-w-2xl"
            >
                {editing ? (
                    <ContentForm
                        layout="inline"
                        fields={ROUTE_SEO_FIELDS}
                        doc={editing}
                        intro={
                            <SerpPreview
                                url={`${siteUrl}${editing.path}`}
                                fallbackTitle={defaults.title}
                                fallbackDescription={defaults.description}
                                template={defaults.template}
                                absolute={editing.key === "home"}
                            />
                        }
                        onSubmit={(values) => saveRouteSeoAction(editing._id, values, editing.updatedAt)}
                        onSaved={() => setEditing(null)}
                        onCancel={() => setEditing(null)}
                        submitLabel="Save SEO"
                    />
                ) : null}
            </Modal>
        </CmsProvider>
    );
}

/** Quick read on the things that most often go wrong. */
function health(route) {
    const out = [];
    if (route.noindex) out.push(["danger", "Hidden from search"]);
    const t = (route.title ?? "").length;
    const d = (route.description ?? "").length;
    if (!t) out.push(["muted", "No title"]);
    else if (t > 60) out.push(["gold", "Long title"]);
    if (!d) out.push(["gold", "No description"]);
    else if (d < 70 || d > 160) out.push(["gold", d < 70 ? "Short description" : "Long description"]);
    if (!out.length) out.push(["success", "Looks good"]);
    if (route.sitemap?.include === false) out.push(["muted", "Not in sitemap"]);
    return out;
}
