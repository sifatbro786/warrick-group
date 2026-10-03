import { requireUser } from "@/server/auth/dal";
import { getOwnAccount } from "@/server/services/auth";
import { PageHeader, Panel, PanelHeader } from "@/components/admin/ui/Panel";
import { ChangePasswordForm, ProfileForm, SignOutEverywhere } from "@/components/admin/account/AccountForms";
import { formatDateTime } from "@/lib/admin/format";

export const metadata = { title: "Account" };

export default async function AccountPage() {
    const session = await requireUser();
    const account = await getOwnAccount(session.id);

    return (
        <>
            <PageHeader eyebrow="Account" title="Account & security" description={account.email} />

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-6">
                    <Panel>
                        <PanelHeader title="Profile" description="Shown in the dashboard and the activity log." />
                        <div className="px-5 py-5">
                            <ProfileForm name={account.name} />
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader
                            title="Password"
                            description="Changing it signs you out on every other device. This one stays signed in."
                        />
                        <div className="px-5 py-5">
                            <ChangePasswordForm email={account.email} />
                        </div>
                    </Panel>
                </div>

                <aside className="space-y-6">
                    <Panel>
                        <dl className="divide-y divide-line text-[13.5px]">
                            {[
                                ["Role", session.isSuperAdmin ? "Super admin" : "Admin"],
                                ["Last sign-in", formatDateTime(account.lastLoginAt)],
                                ["Password last changed", formatDateTime(account.passwordChangedAt)],
                                ["Member since", formatDateTime(account.createdAt)],
                            ].map(([label, value]) => (
                                <div key={label} className="px-5 py-3">
                                    <dt className="text-[12px] text-ink-muted">{label}</dt>
                                    <dd className="mt-0.5 text-ink">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Sessions" />
                        <div className="space-y-4 px-5 py-5">
                            <p className="text-[13px] leading-relaxed text-ink-muted">
                                Lost a laptop or signed in on a shared computer? End every session, including this one.
                            </p>
                            <SignOutEverywhere />
                        </div>
                    </Panel>
                </aside>
            </div>
        </>
    );
}
