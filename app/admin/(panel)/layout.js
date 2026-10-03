import { Suspense } from "react";
import { cookies } from "next/headers";
import { requireUser } from "@/server/auth/dal";
import { countNewInquiries } from "@/server/services/inquiry-admin";
import AdminShell from "@/components/admin/shell/AdminShell";

/**
 * Signed-in chrome. The session read sits inside <Suspense> (Cache
 * Components rule); the fallback is a bare frame in the sidebar colour so
 * the first paint doesn't jump.
 *
 * Layouts don't re-run on client navigation between sibling pages, so this
 * check is not the guard: every page calls requireUser()/requireSuperAdmin()
 * itself, and every action calls authorize().
 */
export default function PanelLayout({ children }) {
    return (
        <Suspense fallback={<ShellFallback />}>
            <Shell>{children}</Shell>
        </Suspense>
    );
}

async function Shell({ children }) {
    const user = await requireUser();
    const [newInquiries, store] = await Promise.all([countNewInquiries(), cookies()]);
    return (
        <AdminShell
            user={{ name: user.name, email: user.email, role: user.role, isSuperAdmin: user.isSuperAdmin }}
            counts={{ newInquiries }}
            initialCollapsed={store.get("wg_sidebar")?.value === "collapsed"}
        >
            {children}
        </AdminShell>
    );
}

function ShellFallback() {
    return (
        <div className="min-h-dvh bg-surface-soft lg:flex" aria-busy="true">
            <div className="hidden h-dvh w-64 shrink-0 bg-royal-night lg:block" />
            <div className="h-14 border-b border-line bg-surface lg:hidden" />
        </div>
    );
}
