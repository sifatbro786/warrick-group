import { cn } from "@/lib/cn";

/** White card with a hairline. The dashboard's only container. */
export function Panel({ className, children, ...props }) {
    return (
        <section className={cn("rounded-lg border border-line bg-surface", className)} {...props}>
            {children}
        </section>
    );
}

export function PanelHeader({ title, description, action, className }) {
    return (
        <header className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4", className)}>
            <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight text-royal">{title}</h2>
                {description ? <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p> : null}
            </div>
            {action}
        </header>
    );
}

/** Page title row. `eyebrow` is the section name in small caps. */
export function PageHeader({ eyebrow, title, description, action }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
            <div className="min-w-0">
                {eyebrow ? <p className="eyebrow mb-2 text-gold-dark">{eyebrow}</p> : null}
                <h1 className="text-[26px] font-semibold leading-tight text-royal lg:text-[30px]">{title}</h1>
                {description ? <p className="mt-1.5 max-w-2xl text-[14px] text-ink-muted">{description}</p> : null}
            </div>
            {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
    );
}

export function EmptyState({ icon: Icon, title, children }) {
    return (
        <div className="flex flex-col items-center px-6 py-14 text-center">
            {Icon ? <Icon className="mb-3 size-6 text-ink-muted/70" aria-hidden="true" /> : null}
            <p className="text-[14px] font-medium text-royal">{title}</p>
            {children ? <div className="mt-1 max-w-sm text-[13px] text-ink-muted">{children}</div> : null}
        </div>
    );
}
