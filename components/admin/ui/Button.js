import { Slot } from "radix-ui";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Admin button. Works in Server and Client Components (no hooks).
 * `asChild` renders the styles onto a child <Link>/<a> instead of a <button>.
 */
const VARIANTS = {
    primary: "bg-royal text-white hover:bg-royal-light disabled:bg-royal/60",
    secondary: "border border-line bg-surface text-royal hover:border-royal/30 hover:bg-surface-card",
    ghost: "text-ink-muted hover:bg-surface-card hover:text-royal",
    danger: "bg-[#9b2c2c] text-white hover:bg-[#7f2424] disabled:bg-[#9b2c2c]/60",
    "danger-ghost": "text-[#9b2c2c] hover:bg-[#9b2c2c]/8",
};

const SIZES = {
    sm: "h-8 gap-1.5 px-3 text-[13px]",
    md: "h-10 gap-2 px-4 text-[14px]",
    icon: "size-9 justify-center",
};

export function buttonClass({ variant = "primary", size = "md", className } = {}) {
    return cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0",
        VARIANTS[variant],
        SIZES[size],
        className,
    );
}

export default function Button({
    variant,
    size,
    className,
    asChild = false,
    pending = false,
    disabled,
    children,
    type = "button",
    ...props
}) {
    const Comp = asChild ? Slot.Root : "button";
    return (
        <Comp
            {...(asChild ? {} : { type, disabled: disabled || pending, "aria-busy": pending || undefined })}
            className={buttonClass({ variant, size, className })}
            {...props}
        >
            {asChild ? (
                children
            ) : (
                <>
                    {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                    {children}
                </>
            )}
        </Comp>
    );
}
