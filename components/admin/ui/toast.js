"use client";

import { toast } from "sonner";

/**
 * Toast an action result. Returns true on success.
 * A redirecting action resolves to undefined: treat it as success, the
 * navigation is the feedback.
 */
export function toastResult(result) {
    if (!result) return true;
    if (result.status === "success") {
        if (result.message) toast.success(result.message);
        return true;
    }
    if (result.status === "error") toast.error(result.message || "Something went wrong. Please try again.");
    return false;
}
