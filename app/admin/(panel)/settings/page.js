import { requireUser } from "@/server/auth/dal";
import { mailEnv } from "@/server/env";
import { getSiteForEdit } from "@/server/services/cms";
import { editorContext } from "@/server/services/cms-context";
import { SITE_SECTIONS } from "@/server/validators/cms";
import { PageHeader, Panel, PanelHeader } from "@/components/admin/ui/Panel";
import { SiteSectionEditor } from "@/components/admin/cms/Editors";
import MailTest from "@/components/admin/settings/MailTest";

/* Reads the session on every request: not an instant navigation (see PHASES.md).
   `instant` is per segment, so each dashboard page opts out itself. */
export const instant = false;

export const metadata = { title: "Settings" };

const SECTIONS = ["brand", "navigation", "footer", "inquiryTypes"];

export default async function SettingsPage() {
    const user = await requireUser();
    const sections = SECTIONS.filter((key) => !SITE_SECTIONS[key].superOnly || user.isSuperAdmin);
    const allFields = Object.assign({}, ...sections.map((key) => SITE_SECTIONS[key].fields));

    const [site, cms] = await Promise.all([getSiteForEdit({ includeRouting: user.isSuperAdmin }), editorContext(allFields)]);
    const mail = mailStatus();

    return (
        <>
            <PageHeader eyebrow="Site" title="Settings" description="Brand, navigation, footer and where contact-form inquiries are delivered." />

            <div className="grid items-start gap-6 lg:grid-cols-[11.5rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)]">
                <nav aria-label="Settings sections" className="sticky top-6 hidden lg:block">
                    <ol className="space-y-0.5 border-l border-line">
                        {[...sections.map((key) => [anchor(key), SITE_SECTIONS[key].label]), ["email", "Email delivery"]].map(([id, label]) => (
                            <li key={id}>
                                <a
                                    href={`#${id}`}
                                    className="-ml-px block border-l-2 border-transparent py-1.5 pl-3 text-[13px] text-ink-muted transition-colors hover:border-gold hover:text-royal"
                                >
                                    {label}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="min-w-0 space-y-6">
                    {sections.map((key) => {
                        const section = SITE_SECTIONS[key];
                        const doc = section.root ? { inquiryTypes: site?.inquiryTypes ?? [] } : site?.[key] ?? {};
                        return (
                            <Panel key={key} id={anchor(key)} className="scroll-mt-24">
                                <PanelHeader title={section.label} description={section.description} />
                                <div className="px-5 py-5">
                                    <SiteSectionEditor sectionKey={key} doc={doc} cms={cms} />
                                </div>
                            </Panel>
                        );
                    })}

                    <Panel id="email" className="scroll-mt-24">
                        <PanelHeader
                            title="Email delivery"
                            description="SMTP is configured on the server (.env), not here, so the password never passes through the dashboard."
                        />
                        <dl className="divide-y divide-line text-[13.5px]">
                            {[
                                ["SMTP server", mail.configured ? `${mail.host}:${mail.port}${mail.secure ? " (TLS)" : ""}` : "Not configured"],
                                ["Sends as", mail.configured ? `${mail.fromName} <${mail.user}>` : "—"],
                                ["Fallback inbox", mail.fallback || "Not set — desks without a mailbox can't be delivered"],
                            ].map(([label, value]) => (
                                <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                                    <dt className="text-ink-muted">{label}</dt>
                                    <dd className="break-words text-ink">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="border-t border-line px-5 py-4">
                            <MailTest email={user.email} disabled={!mail.configured} />
                            {!mail.configured ? (
                                <p className="mt-2 text-[12.5px] text-ink-muted">Fill in SMTP_HOST, SMTP_USER and SMTP_PASS in the server environment first.</p>
                            ) : null}
                        </div>
                    </Panel>
                </div>
            </div>
        </>
    );
}

const anchor = (key) => (key === "inquiryTypes" ? "inquiries" : key);

/** What the admin may see about SMTP: never the password. */
function mailStatus() {
    try {
        const env = mailEnv();
        return {
            configured: true,
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            user: env.SMTP_USER,
            fromName: env.MAIL_FROM_NAME,
            fallback: env.CONTACT_FALLBACK_INBOX || null,
        };
    } catch {
        return { configured: false, fallback: process.env.CONTACT_FALLBACK_INBOX || null };
    }
}
