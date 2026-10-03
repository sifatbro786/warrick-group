"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastResult } from "@/components/admin/ui/toast";

/**
 * react-hook-form + a Server Action, one contract for every admin form.
 *
 * The Zod schema runs in the browser for instant feedback and again inside
 * the action, which is the one that decides. Action results:
 *   { status: "invalid", errors: { field: message } } → shown on the fields
 *   { status: "error", message }                     → form-level alert
 *   { status: "success", message? }                  → toast + onSuccess
 *
 * @param {{ schema: import("zod").ZodType, defaultValues: object,
 *           action: (values: object) => Promise<object|undefined>,
 *           onSuccess?: (result: object|undefined, form: object) => void,
 *           alertErrors?: boolean }} options
 *   alertErrors: show "error" results inside the form instead of a toast.
 */
export function useServerForm({ schema, defaultValues, action, onSuccess, alertErrors = true }) {
    const form = useForm({ resolver: zodResolver(schema), defaultValues, mode: "onTouched" });
    const [formError, setFormError] = useState(null);

    const onSubmit = form.handleSubmit(async (values) => {
        setFormError(null);
        let result;
        try {
            result = await action(values);
        } catch (error) {
            /* Redirects are not errors; Next handles the navigation. */
            if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
            console.error(error);
            result = { status: "error" };
        }

        if (result?.status === "invalid") {
            for (const [name, message] of Object.entries(result.errors ?? {})) {
                form.setError(name, { type: "server", message }, { shouldFocus: true });
            }
            return;
        }
        if (result?.status === "error" && alertErrors) {
            setFormError(result.message || "Something went wrong. Please try again.");
            return;
        }
        if (toastResult(result)) onSuccess?.(result, form);
    });

    return { form, onSubmit, formError, pending: form.formState.isSubmitting };
}
