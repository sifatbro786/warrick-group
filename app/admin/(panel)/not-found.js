import Link from "next/link";
import { buttonClass } from "@/components/admin/ui/Button";

/** notFound() inside the dashboard (deleted inquiry, stale link). */
export default function AdminNotFound() {
    return (
        <div className="rounded-lg border border-line bg-surface px-6 py-14 text-center">
            <p className="eyebrow text-gold-dark">Not found</p>
            <h1 className="mt-3 text-[20px] font-semibold text-royal">This record doesn&rsquo;t exist any more</h1>
            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-ink-muted">
                It may have been deleted, or the link is out of date.
            </p>
            <Link href="/admin" className={buttonClass({ variant: "secondary", className: "mt-6" })}>
                Back to overview
            </Link>
        </div>
    );
}
