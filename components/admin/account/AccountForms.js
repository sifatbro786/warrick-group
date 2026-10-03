"use client";

import { LogOut } from "lucide-react";
import { changePassword, logoutEverywhere, updateProfile } from "@/server/actions/auth";
import { changePasswordSchema, profileSchema } from "@/server/validators/auth";
import { useServerForm } from "@/lib/admin/useServerForm";
import Button from "@/components/admin/ui/Button";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import PasswordInput from "@/components/admin/ui/PasswordInput";
import { describe, Field, FormAlert, Input } from "@/components/admin/ui/Form";

export function ProfileForm({ name }) {
    const { form, onSubmit, formError, pending } = useServerForm({
        schema: profileSchema,
        defaultValues: { name },
        action: updateProfile,
        onSuccess: (_result, f) => f.reset(f.getValues()),
    });
    const { errors, isDirty } = form.formState;

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <FormAlert>{formError}</FormAlert>
            <Field label="Full name" htmlFor="pf-name" error={errors.name?.message} className="flex-1">
                <Input autoComplete="name" {...describe("pf-name", errors.name)} {...form.register("name")} />
            </Field>
            <Button type="submit" variant="secondary" pending={pending} disabled={!isDirty} className="sm:mt-[1.6rem]">
                Save
            </Button>
        </form>
    );
}

export function ChangePasswordForm({ email }) {
    const { form, onSubmit, formError, pending } = useServerForm({
        schema: changePasswordSchema,
        defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
        action: changePassword,
        onSuccess: (_result, f) => f.reset(),
    });
    const { errors } = form.formState;

    return (
        <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
            <FormAlert>{formError}</FormAlert>
            {/* Lets password managers attach the new password to the right account. */}
            <input type="email" autoComplete="username" hidden readOnly value={email} />
            <Field label="Current password" htmlFor="cp-current" error={errors.currentPassword?.message}>
                <PasswordInput
                    autoComplete="current-password"
                    {...describe("cp-current", errors.currentPassword)}
                    {...form.register("currentPassword")}
                />
            </Field>
            <Field
                label="New password"
                htmlFor="cp-new"
                error={errors.password?.message}
                hint="At least 12 characters. A short sentence works well."
            >
                <PasswordInput autoComplete="new-password" {...describe("cp-new", errors.password, "hint")} {...form.register("password")} />
            </Field>
            <Field label="Confirm new password" htmlFor="cp-confirm" error={errors.confirmPassword?.message}>
                <PasswordInput
                    autoComplete="new-password"
                    {...describe("cp-confirm", errors.confirmPassword)}
                    {...form.register("confirmPassword")}
                />
            </Field>
            <Button type="submit" pending={pending}>
                Change password
            </Button>
        </form>
    );
}

export function SignOutEverywhere() {
    return (
        <ConfirmDialog
            trigger={
                <Button variant="secondary" className="w-full">
                    <LogOut aria-hidden="true" />
                    Sign out everywhere
                </Button>
            }
            title="Sign out of every device?"
            description="All your sessions end, including this one. You'll need your password to sign back in."
            confirmLabel="Sign out everywhere"
            onConfirm={() => logoutEverywhere()}
        />
    );
}
