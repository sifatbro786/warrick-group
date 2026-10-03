"use client";

import { login } from "@/server/actions/auth";
import { loginSchema } from "@/server/validators/auth";
import { useServerForm } from "@/lib/admin/useServerForm";
import Button from "@/components/admin/ui/Button";
import PasswordInput from "@/components/admin/ui/PasswordInput";
import { describe, Field, FormAlert, Input } from "@/components/admin/ui/Form";

/** On success the action redirects, so there is no success branch here. */
export default function LoginForm({ next }) {
    const { form, onSubmit, formError, pending } = useServerForm({
        schema: loginSchema,
        defaultValues: { email: "", password: "" },
        action: (values) => login({ ...values, next }),
    });
    const { errors } = form.formState;

    /* method="post": if JS hasn't loaded yet, a native submit must never put the password in the URL. */
    return (
        <form method="post" onSubmit={onSubmit} noValidate className="space-y-5">
            <FormAlert>{formError}</FormAlert>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <Input
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    autoFocus
                    {...describe("email", errors.email)}
                    {...form.register("email")}
                />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password?.message}>
                <PasswordInput autoComplete="current-password" {...describe("password", errors.password)} {...form.register("password")} />
            </Field>
            <Button type="submit" pending={pending} className="w-full">
                Sign in
            </Button>
            <p className="text-[12.5px] leading-relaxed text-ink-muted">
                Forgot your password? Ask a super admin to reset it from the Users page.
            </p>
        </form>
    );
}
