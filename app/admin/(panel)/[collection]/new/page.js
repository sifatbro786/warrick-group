import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/dal";
import { editorContext } from "@/server/services/cms-context";
import { COLLECTION_SPECS } from "@/server/validators/cms";
import { PageHeader } from "@/components/admin/ui/Panel";
import { BackLink, ItemEditor } from "@/components/admin/cms/Editors";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export async function generateMetadata({ params }) {
    const { collection } = await params;
    return { title: Object.hasOwn(COLLECTION_SPECS, collection) ? `New ${COLLECTION_SPECS[collection].singular}` : "New" };
}

export default async function NewItemPage({ params }) {
    const user = await requireUser();
    const { collection: kind } = await params;
    if (!Object.hasOwn(COLLECTION_SPECS, kind)) notFound();

    const spec = COLLECTION_SPECS[kind];
    const cms = await editorContext(spec.fields);

    return (
        <>
            <BackLink href={`/admin/${kind}`}>{spec.label}</BackLink>
            <PageHeader eyebrow={spec.label} title={`New ${spec.singular}`} description={spec.description} />
            <ItemEditor kind={kind} id={null} doc={null} version={null} canDelete={user.isSuperAdmin} cms={cms} />
        </>
    );
}
