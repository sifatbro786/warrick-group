import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/dal";
import { getPageForEdit } from "@/server/services/cms";
import { editorContext } from "@/server/services/cms-context";
import { PAGE_SPECS } from "@/server/validators/cms";
import { PageHeader } from "@/components/admin/ui/Panel";
import { BackLink, PageEditor } from "@/components/admin/cms/Editors";
import { formatRelative } from "@/lib/admin/format";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export async function generateMetadata({ params }) {
    const { key } = await params;
    return { title: Object.hasOwn(PAGE_SPECS, key) ? `${PAGE_SPECS[key].label} page` : "Page" };
}

export default async function EditPage({ params }) {
    await requireUser();
    const { key } = await params;
    if (!Object.hasOwn(PAGE_SPECS, key)) notFound();

    const spec = PAGE_SPECS[key];
    const [doc, cms] = await Promise.all([getPageForEdit(key), editorContext(spec.fields)]);
    if (!doc) notFound();

    return (
        <>
            <BackLink href="/admin/pages">Pages</BackLink>
            <PageHeader
                eyebrow="Page editor"
                title={
                    <>
                        {spec.label} page <span className="ml-1 align-middle font-mono text-[14px] font-normal text-ink-muted">{spec.path}</span>
                    </>
                }
                description={
                    <>
                        {spec.description} Last saved {formatRelative(doc.updatedAt)}.
                        {spec.uses?.length ? (
                            <span className="mt-1 block">
                                {spec.uses.map((use, index) => (
                                    <span key={use.href}>
                                        {index ? " · " : ""}
                                        <Link href={use.href} className="text-royal-light underline-offset-2 hover:underline">
                                            {use.label}
                                        </Link>
                                    </span>
                                ))}
                            </span>
                        ) : null}
                    </>
                }
            />
            <PageEditor pageKey={key} doc={doc} version={doc.updatedAt} cms={cms} />
        </>
    );
}
