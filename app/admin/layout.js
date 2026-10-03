import Toaster from "@/components/admin/ui/Toaster";
import "./admin.css";

/**
 * /admin root. Everything below is per-request (it reads the session), so
 * no segment here is prerendered and instant-navigation validation is off.
 * Auth: proxy.js (optimistic) → server/auth/dal.js (authoritative).
 */
export const instant = false;

export const metadata = {
    title: { template: "%s · Warrick Admin", default: "Warrick Admin" },
    robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
    return (
        <>
            {children}
            <Toaster />
        </>
    );
}
