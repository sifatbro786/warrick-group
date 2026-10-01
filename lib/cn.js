import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional class names with Tailwind conflict resolution. */
export const cn = (...inputs) => twMerge(clsx(inputs));
