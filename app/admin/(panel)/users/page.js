import { requireSuperAdmin } from "@/server/auth/dal";
import { listUsers } from "@/server/services/users";
import { PageHeader, Panel } from "@/components/admin/ui/Panel";
import Badge from "@/components/admin/ui/Badge";
import { CreateUserButton, UserRowActions } from "@/components/admin/users/UserManager";
import { formatRelative } from "@/lib/admin/format";
import { cn } from "@/lib/cn";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export const metadata = { title: "Users" };

const ROLE = { super_admin: "Super admin", admin: "Admin" };

export default async function UsersPage() {
    const me = await requireSuperAdmin();
    const users = await listUsers();

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Dashboard users"
                description="Admins manage content and inquiries. Super admins can also manage users."
                action={<CreateUserButton />}
            />

            <Panel>
                <div className="hidden grid-cols-[minmax(0,1.6fr)_8rem_8rem_8rem_2.5rem] gap-4 border-b border-line px-5 py-2.5 text-[12px] text-ink-muted md:grid">
                    <span>Name</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Last sign-in</span>
                    <span className="sr-only">Actions</span>
                </div>
                <ul className="divide-y divide-line">
                    {users.map((user) => {
                        const id = String(user._id);
                        const self = id === me.id;
                        const { locked } = user;
                        return (
                            <li
                                key={id}
                                className={cn(
                                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 md:grid-cols-[minmax(0,1.6fr)_8rem_8rem_8rem_2.5rem]",
                                    !user.isActive && "bg-surface-soft",
                                )}
                            >
                                <div className="min-w-0">
                                    <p className={cn("truncate text-[14px] font-medium", user.isActive ? "text-royal" : "text-ink-muted")}>
                                        {user.name}
                                        {self ? <span className="ml-2 text-[12px] font-normal text-ink-muted">(you)</span> : null}
                                    </p>
                                    <p className="truncate text-[12.5px] text-ink-muted">{user.email}</p>
                                </div>
                                <div className="col-start-2 row-start-1 md:col-start-5">
                                    <UserRowActions user={serialize(user)} self={self} locked={locked} />
                                </div>
                                {/* Mobile: one wrapped meta line. Desktop: three grid columns. */}
                                <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 md:contents">
                                    <p className="text-[13px] text-ink">
                                        {ROLE[user.role]}
                                    </p>
                                    <p>
                                        {!user.isActive ? (
                                            <Badge>Deactivated</Badge>
                                        ) : locked ? (
                                            <Badge tone="danger">Locked</Badge>
                                        ) : (
                                            <Badge tone="success">Active</Badge>
                                        )}
                                    </p>
                                    <p className="text-[12.5px] text-ink-muted">
                                        {user.lastLoginAt ? (
                                            <>
                                                <span className="md:hidden">Signed in </span>
                                                {formatRelative(user.lastLoginAt)}
                                            </>
                                        ) : (
                                            <>
                                                Never<span className="md:hidden"> signed in</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </Panel>
            <p className="mt-4 text-[12.5px] text-ink-muted">
                Five wrong passwords lock an account for 15 minutes. Deactivating or resetting a password signs that person out
                everywhere.
            </p>
        </>
    );
}

const serialize = (user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
});
