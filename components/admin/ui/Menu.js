"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/cn";

/** Row/action menu. Items take onSelect; use `tone="danger"` for destructive ones. */
export function Menu({ trigger, align = "end", children }) {
    return (
        <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align={align}
                    sideOffset={6}
                    className="admin-pop z-50 min-w-48 rounded-md border border-line bg-surface p-1 shadow-premium"
                >
                    {children}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

const ITEM =
    "flex cursor-pointer items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-[13.5px] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

/**
 * Menu row. Pass `href` for navigation (internal → next/link, `external`
 * → new tab), otherwise `onSelect`.
 */
export function MenuItem({ tone, icon: Icon, href, external = false, onClick, children, ...props }) {
    const className = cn(
        ITEM,
        tone === "danger"
            ? "text-[#9b2c2c] data-[highlighted]:bg-[#9b2c2c]/8"
            : "text-ink data-[highlighted]:bg-surface-card data-[highlighted]:text-royal",
    );
    const body = (
        <>
            {Icon ? <Icon className="size-4 shrink-0 opacity-70" aria-hidden="true" /> : null}
            {children}
        </>
    );

    if (href) {
        return (
            <DropdownMenu.Item asChild className={className} {...props}>
                {external ? (
                    <a href={href} target="_blank" rel="noopener" onClick={onClick}>
                        {body}
                    </a>
                ) : (
                    <Link href={href} onClick={onClick}>
                        {body}
                    </Link>
                )}
            </DropdownMenu.Item>
        );
    }
    return (
        <DropdownMenu.Item className={className} {...props}>
            {body}
        </DropdownMenu.Item>
    );
}

export const MenuSeparator = () => <DropdownMenu.Separator className="my-1 h-px bg-line" />;
