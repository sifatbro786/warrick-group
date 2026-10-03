import { cn } from "@/lib/cn";

/**
 * Form primitives. Plain elements, so they work with react-hook-form's
 * register() (it passes ref as a prop in React 19).
 */

const CONTROL =
    "w-full rounded-md border border-line bg-surface px-3 text-[14px] text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted/60 focus:border-royal/50 focus:shadow-[0_0_0_3px_rgb(46_26_71/0.08)] focus:outline-none disabled:bg-surface-card disabled:text-ink-muted aria-[invalid=true]:border-[#9b2c2c]/60";

export function Input({ className, ...props }) {
    return <input className={cn(CONTROL, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }) {
    return <textarea className={cn(CONTROL, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
    return (
        <select
            className={cn(
                CONTROL,
                "h-10 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2371717a%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[position:right_0.75rem_center] bg-no-repeat pr-9",
                className,
            )}
            {...props}
        >
            {children}
        </select>
    );
}

/** Label + control + hint/error. Pass the control's id as `htmlFor`. */
export function Field({ label, htmlFor, error, hint, className, children }) {
    return (
        <div className={cn("space-y-1.5", className)}>
            {label ? (
                <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
                    {label}
                </label>
            ) : null}
            {children}
            {error ? (
                <p id={`${htmlFor}-error`} role="alert" className="text-[12.5px] leading-snug text-[#9b2c2c]">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${htmlFor}-hint`} className="text-[12.5px] leading-snug text-ink-muted">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

/** Props that wire an input to its Field's error/hint text. */
export const describe = (id, error, hint) => ({
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});

/** Form-level message (not tied to one field). */
export function FormAlert({ children }) {
    if (!children) return null;
    return (
        <p role="alert" className="rounded-md border border-[#9b2c2c]/20 bg-[#9b2c2c]/5 px-3 py-2.5 text-[13px] text-[#9b2c2c]">
            {children}
        </p>
    );
}
