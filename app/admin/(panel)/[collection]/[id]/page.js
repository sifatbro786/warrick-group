import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/dal";
import { getItem } from "@/server/services/cms";
import { editorContext } from "@/server/services/cms-context";
import { COLLECTION_SPECS } from "@/server/validators/cms";
import { PageHeader } from "@/components/admin/ui/Panel";
import { BackLink, ItemEditor } from "@/components/admin/cms/Editors";
import { formatRelative } from "@/lib/admin/format";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export async function generateMetadata({ params }) {
    const { collection } = await params;
    return { title: Object.hasOwn(COLLECTION_SPECS, collection) ? `Edit ${COLLECTION_SPECS[collection].singular}` : "Edit" };
}

export default async function EditItemPage({ params }) {
    const user = await requireUser();
    const { collection: kind, id } = await params;
    if (!Object.hasOwn(COLLECTION_SPECS, kind)) notFound();

    const spec = COLLECTION_SPECS[kind];
    const [doc, cms] = await Promise.all([getItem(kind, id), editorContext(spec.fields)]);
    if (!doc) notFound();

    const title = doc[spec.list.title] || `Untitled ${spec.singular}`;
    const published = spec.publish ? doc[spec.publish.field] === spec.publish.on : undefined;

    return (
        <>
            <BackLink href={`/admin/${kind}`}>{spec.label}</BackLink>
            <PageHeader eyebrow={spec.label} title={title} description={`Last saved ${formatRelative(doc.updatedAt)}.`} />
            <ItemEditor
                kind={kind}
                id={id}
                doc={doc}
                version={doc.updatedAt}
                published={published}
                canDelete={user.isSuperAdmin}
                cms={cms}
            />
        </>
    );
}
