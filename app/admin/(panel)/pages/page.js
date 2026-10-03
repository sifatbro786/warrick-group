import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/server/auth/dal";
import { listPages } from "@/server/services/cms";
import { PAGE_SPECS } from "@/server/validators/cms";
import { PageHeader, Panel } from "@/components/admin/ui/Panel";
import { formatRelative } from "@/lib/admin/format";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export const metadata = { title: "Pages" };

export default async function PagesIndex() {
    await requireUser();
    const meta = await listPages();

    return (
        <>
            <PageHeader
                eyebrow="Content"
                title="Pages"
                description="Section copy for every public page. Companies, articles, people and other records have their own screens."
            />
            <Panel>
                <ul className="divide-y divide-line">
                    {Object.values(PAGE_SPECS).map((spec) => {
                        const info = meta[spec.key];
                        return (
                            <li key={spec.key}>
                                <Link
                                    href={`/admin/pages/${spec.key}`}
                                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-soft"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap items-baseline gap-x-3 text-[14.5px] font-medium text-royal">
                                            {spec.label}
                                            <span className="font-mono text-[12px] font-normal text-ink-muted">{spec.path}</span>
                                        </p>
                                        <p className="mt-0.5 text-[13px] text-ink-muted">{spec.description}</p>
                                    </div>
                                    <p className="hidden shrink-0 text-right text-[12.5px] text-ink-muted sm:block">
                                        {info ? (
                                            <>
                                                Edited {formatRelative(info.updatedAt)}
                                                {info.updatedBy ? <span className="block">by {info.updatedBy}</span> : null}
                                            </>
                                        ) : (
                                            <span className="text-[#9b2c2c]">Missing — run the seed</span>
                                        )}
                                    </p>
                                    <ChevronRight className="size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </Panel>
            <p className="mt-4 text-[12.5px] text-ink-muted">Privacy, Terms and the error pages are fixed text and are not edited here.</p>
        </>
    );
}
