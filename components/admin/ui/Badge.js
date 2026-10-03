import { cn } from "@/lib/cn";

/** Dot + label. Colour carries meaning only alongside the word. */
const TONES = {
    gold: "text-gold-dark before:bg-gold",
    royal: "text-royal before:bg-royal",
    muted: "text-ink-muted before:bg-ink-muted/50",
    danger: "text-[#9b2c2c] before:bg-[#9b2c2c]",
    success: "text-[#2f6b45] before:bg-[#2f6b45]",
};

export default function Badge({ tone = "muted", className, children }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
                TONES[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}

export const INQUIRY_STATUS = {
    new: { tone: "gold", label: "New" },
    read: { tone: "muted", label: "Read" },
    archived: { tone: "muted", label: "Archived" },
};
