"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, Tooltip } from "radix-ui";
import {
    Building2,
    ExternalLink,
    FileDown,
    Files,
    FlaskConical,
    History,
    Images,
    Inbox,
    LayoutDashboard,
    LogOut,
    MapPin,
    Menu as MenuIcon,
    Newspaper,
    PanelLeftClose,
    PanelLeftOpen,
    SearchCheck,
    Settings,
    UserRound,
    Users,
    UsersRound,
    X,
} from "lucide-react";
import { logout } from "@/server/actions/auth";
import { Menu, MenuItem, MenuSeparator } from "@/components/admin/ui/Menu";
import { cn } from "@/lib/cn";

/**
 * Dashboard chrome: collapsible sidebar (desktop), drawer (mobile), user menu.
 * ---------------------------------------------------------------------------
 * Navigation lives here, not in the DB: it is interface, not content.
 *
 * Hiding "Users" for admins is cosmetic; the page and every action check
 * the role on the server.
 */

/** @type {Array<{ label?: string, items: Array<{ href: string, label: string, icon: any, superOnly?: boolean, badge?: string, exact?: boolean, also?: string[] }> }>} */
const NAV = [
    {
        items: [
            { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
            { href: "/admin/inquiries", label: "Inquiries", icon: Inbox, badge: "newInquiries" },
        ],
    },
    {
        label: "Content",
        items: [
            { href: "/admin/pages", label: "Pages", icon: Files },
            { href: "/admin/businesses", label: "Businesses", icon: Building2 },
            /* Categories live under the newsroom. */
            { href: "/admin/articles", label: "Newsroom", icon: Newspaper, also: ["/admin/categories"] },
            { href: "/admin/leaders", label: "Leadership", icon: UsersRound },
            { href: "/admin/ventures", label: "Ventures", icon: FlaskConical },
            { href: "/admin/reports", label: "Reports", icon: FileDown },
            { href: "/admin/offices", label: "Offices", icon: MapPin },
            { href: "/admin/media", label: "Media", icon: Images },
        ],
    },
    {
        label: "Site",
        items: [
            { href: "/admin/seo", label: "SEO", icon: SearchCheck },
            { href: "/admin/settings", label: "Settings", icon: Settings },
        ],
    },
    {
        label: "Administration",
        items: [
            { href: "/admin/users", label: "Users", icon: Users, superOnly: true },
            { href: "/admin/activity", label: "Activity log", icon: History },
        ],
    },
];

const COOKIE = "wg_sidebar";
const ROLE_LABEL = { super_admin: "Super admin", admin: "Admin" };

export default function AdminShell({ user, counts, initialCollapsed, children }) {
    const [collapsed, setCollapsed] = useState(initialCollapsed);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        /* Read by the server layout, so the next load renders the right width
           with no flash. Not sensitive; one year. */
        document.cookie = `${COOKIE}=${next ? "collapsed" : "open"}; path=/admin; max-age=31536000; samesite=lax`;
    };

    return (
        <Tooltip.Provider delayDuration={150}>
            <div className="min-h-dvh bg-surface-soft lg:flex">
                <a
                    href="#admin-main"
                    className="sr-only z-[60] rounded-md bg-royal px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
                >
                    Skip to content
                </a>

                {/* Desktop sidebar */}
                <aside
                    className={cn(
                        "sticky top-0 hidden h-dvh shrink-0 flex-col bg-royal-night transition-[width] duration-300 ease-premium lg:flex",
                        collapsed ? "w-[4.5rem]" : "w-64",
                    )}
                    aria-label="Dashboard"
                >
                    <SidebarBody user={user} counts={counts} collapsed={collapsed} />
                    <div className="border-t border-white/8 p-3">
                        <button
                            type="button"
                            onClick={toggle}
                            className={cn(
                                "flex h-9 w-full items-center gap-3 rounded-md px-3 text-[13px] text-white/50 transition-colors hover:bg-white/5 hover:text-white",
                                collapsed && "justify-center px-0",
                            )}
                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                            aria-expanded={!collapsed}
                        >
                            {collapsed ? (
                                <PanelLeftOpen className="size-4" aria-hidden="true" />
                            ) : (
                                <>
                                    <PanelLeftClose className="size-4" aria-hidden="true" />
                                    Collapse
                                </>
                            )}
                        </button>
                    </div>
                </aside>

                <div className="min-w-0 flex-1">
                    {/* Mobile bar */}
                    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
                        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
                            <Dialog.Trigger
                                className="-ml-2 rounded-md p-2 text-royal transition-colors hover:bg-surface-card"
                                aria-label="Open menu"
                            >
                                <MenuIcon className="size-5" aria-hidden="true" />
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="admin-overlay fixed inset-0 z-50 bg-royal-night/60 lg:hidden" />
                                <Dialog.Content className="admin-sheet fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col bg-royal-night shadow-premium-lg focus:outline-none lg:hidden">
                                    <Dialog.Title className="sr-only">Dashboard menu</Dialog.Title>
                                    <Dialog.Description className="sr-only">Navigate the dashboard</Dialog.Description>
                                    <SidebarBody
                                        user={user}
                                        counts={counts}
                                        collapsed={false}
                                        onNavigate={() => setDrawerOpen(false)}
                                    />
                                    <Dialog.Close
                                        className="absolute top-4 right-3 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                                        aria-label="Close menu"
                                    >
                                        <X className="size-4" aria-hidden="true" />
                                    </Dialog.Close>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                        <Brand compact />
                    </header>

                    <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 focus:outline-none sm:px-6 lg:px-10 lg:py-10">
                        {children}
                    </main>
                </div>
            </div>
        </Tooltip.Provider>
    );
}

function Brand({ compact = false, collapsed = false }) {
    return (
        <Link href="/admin" className="group flex min-w-0 items-center gap-2.5">
            <Image src="/logo.png" alt="" width={552} height={435} sizes="32px" className="h-6 w-auto shrink-0" />
            {collapsed ? null : (
                <span className="flex min-w-0 items-baseline gap-2">
                    <span
                        className={cn(
                            "font-display text-[14px] leading-none font-bold tracking-[0.02em]",
                            compact ? "text-royal-dark" : "text-white",
                        )}
                    >
                        WARRICK
                    </span>
                    <span className={cn("eyebrow !text-[10px]", compact ? "text-gold-dark" : "text-gold")}>Admin</span>
                </span>
            )}
        </Link>
    );
}

function SidebarBody({ user, counts, collapsed, onNavigate }) {
    const pathname = usePathname();
    const matches = (href) => pathname === href || pathname.startsWith(`${href}/`);
    const isActive = (item) => (item.exact ? pathname === item.href : matches(item.href) || Boolean(item.also?.some(matches)));

    return (
        <>
            <div className={cn("flex h-16 items-center border-b border-white/8", collapsed ? "justify-center px-0" : "px-5")}>
                <Brand collapsed={collapsed} />
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Sections">
                {NAV.map((group, index) => {
                    const items = group.items.filter((item) => !item.superOnly || user.isSuperAdmin);
                    if (!items.length) return null;
                    return (
                        <div key={group.label ?? index} className={index ? "mt-6" : undefined}>
                            {group.label && !collapsed ? (
                                <p className="eyebrow mb-2 px-3 !text-[10px] text-white/35">{group.label}</p>
                            ) : null}
                            {group.label && collapsed ? <div className="mx-3 mb-3 h-px bg-white/8" /> : null}
                            <ul className="space-y-0.5">
                                {items.map((item) => (
                                    <li key={item.href}>
                                        <NavLink
                                            item={item}
                                            active={isActive(item)}
                                            collapsed={collapsed}
                                            count={item.badge ? counts[item.badge] : 0}
                                            onNavigate={onNavigate}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            <div className={cn("border-t border-white/8 p-3", collapsed && "flex justify-center")}>
                <Menu
                    align={collapsed ? "start" : "end"}
                    trigger={
                        <button
                            type="button"
                            className={cn(
                                "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-white/5",
                                collapsed && "w-auto",
                            )}
                            aria-label="Account menu"
                        >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-[13px] font-semibold text-gold-light">
                                {initials(user.name)}
                            </span>
                            {collapsed ? null : (
                                <span className="min-w-0">
                                    <span className="block truncate text-[13px] font-medium text-white">{user.name}</span>
                                    <span className="block truncate text-[11.5px] text-white/45">{ROLE_LABEL[user.role]}</span>
                                </span>
                            )}
                        </button>
                    }
                >
                    <div className="px-2.5 pt-1.5 pb-2">
                        <p className="truncate text-[13px] font-medium text-royal">{user.name}</p>
                        <p className="truncate text-[12px] text-ink-muted">{user.email}</p>
                    </div>
                    <MenuSeparator />
                    <MenuItem icon={UserRound} href="/admin/account" onClick={onNavigate}>
                        Account &amp; security
                    </MenuItem>
                    <MenuItem icon={ExternalLink} href="/" external>
                        View website
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem icon={LogOut} onSelect={() => logout()}>
                        Sign out
                    </MenuItem>
                </Menu>
            </div>
        </>
    );
}

function NavLink({ item, active, collapsed, count, onNavigate }) {
    const Icon = item.icon;
    const link = (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
                "relative flex h-10 items-center gap-3 rounded-md px-3 text-[13.5px] transition-colors duration-200",
                active ? "bg-white/[0.07] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                collapsed && "justify-center px-0",
            )}
        >
            {/* Active marker: a short gold rule, the site's accent device. */}
            <span
                aria-hidden="true"
                className={cn(
                    "absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gold transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                )}
            />
            <Icon className={cn("size-[18px] shrink-0", active ? "text-gold-light" : "")} aria-hidden="true" />
            {collapsed ? (
                count ? <span className="absolute top-2 right-3 size-1.5 rounded-full bg-gold" aria-hidden="true" /> : null
            ) : (
                <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {count ? (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-light tabular-nums">
                            {count > 99 ? "99+" : count}
                            <span className="sr-only"> new</span>
                        </span>
                    ) : null}
                </>
            )}
        </Link>
    );

    if (!collapsed) return link;
    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content
                    side="right"
                    sideOffset={10}
                    className="z-50 rounded-md bg-royal px-2.5 py-1.5 text-[12.5px] text-white shadow-premium"
                >
                    {item.label}
                    {count ? ` · ${count} new` : ""}
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}

const initials = (name = "") =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";
