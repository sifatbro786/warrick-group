"use client";

import { useState } from "react";
import { Ellipsis, KeyRound, Pencil, Plus, Sparkles, Unlock, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import {
    createUserAction,
    resetUserPasswordAction,
    setUserActiveAction,
    unlockUserAction,
    updateUserAction,
} from "@/server/actions/users";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "@/server/validators/auth";
import { useServerForm } from "@/lib/admin/useServerForm";
import Button from "@/components/admin/ui/Button";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import Modal from "@/components/admin/ui/Modal";
import PasswordInput from "@/components/admin/ui/PasswordInput";
import { Menu, MenuItem } from "@/components/admin/ui/Menu";
import { describe, Field, FormAlert, Input, Select } from "@/components/admin/ui/Form";
import { toastResult } from "@/components/admin/ui/toast";

/* ---- Create ------------------------------------------------------------- */

export function CreateUserButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus aria-hidden="true" />
                Add user
            </Button>
            <Modal
                open={open}
                onOpenChange={setOpen}
                title="Add a dashboard user"
                description="They sign in with this email and password. Share the password through a private channel."
            >
                {open ? <CreateUserForm onDone={() => setOpen(false)} /> : null}
            </Modal>
        </>
    );
}

function CreateUserForm({ onDone }) {
    const { form, onSubmit, formError, pending } = useServerForm({
        schema: createUserSchema,
        defaultValues: { name: "", email: "", role: "admin", password: "", confirmPassword: "" },
        action: createUserAction,
        onSuccess: onDone,
    });
    const { errors } = form.formState;

    return (
        <form method="post" onSubmit={onSubmit} noValidate className="space-y-4">
            <FormAlert>{formError}</FormAlert>
            <Field label="Full name" htmlFor="cu-name" error={errors.name?.message}>
                <Input autoComplete="off" {...describe("cu-name", errors.name)} {...form.register("name")} />
            </Field>
            <Field label="Email" htmlFor="cu-email" error={errors.email?.message}>
                <Input type="email" autoComplete="off" {...describe("cu-email", errors.email)} {...form.register("email")} />
            </Field>
            <RoleField id="cu-role" form={form} error={errors.role?.message} />
            <PasswordFields idPrefix="cu" form={form} />
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={onDone} disabled={pending}>
                    Cancel
                </Button>
                <Button type="submit" pending={pending}>
                    Create account
                </Button>
            </div>
        </form>
    );
}

/* ---- Row actions -------------------------------------------------------- */

/**
 * @param {{ user: { id: string, name: string, email: string, role: string, isActive: boolean }, self: boolean, locked: boolean }} props
 */
export function UserRowActions({ user, self, locked }) {
    const [dialog, setDialog] = useState(null); // "edit" | "password" | "active" | null
    const close = () => setDialog(null);

    const unlock = async () => toastResult(await unlockUserAction(user.id));

    return (
        <>
            <Menu
                trigger={
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}>
                        <Ellipsis aria-hidden="true" />
                    </Button>
                }
            >
                <MenuItem icon={Pencil} onSelect={() => setDialog("edit")}>
                    {self ? "Edit name" : "Edit name & role"}
                </MenuItem>
                {self ? (
                    <MenuItem icon={KeyRound} href="/admin/account">
                        Change my password
                    </MenuItem>
                ) : (
                    <>
                        <MenuItem icon={KeyRound} onSelect={() => setDialog("password")}>
                            Reset password
                        </MenuItem>
                        {locked ? (
                            <MenuItem icon={Unlock} onSelect={unlock}>
                                Unlock now
                            </MenuItem>
                        ) : null}
                        {user.isActive ? (
                            <MenuItem icon={UserX} tone="danger" onSelect={() => setDialog("active")}>
                                Deactivate
                            </MenuItem>
                        ) : (
                            <MenuItem icon={UserCheck} onSelect={() => setDialog("active")}>
                                Reactivate
                            </MenuItem>
                        )}
                    </>
                )}
            </Menu>

            <Modal open={dialog === "edit"} onOpenChange={(o) => !o && close()} title={`Edit ${user.name}`} description={user.email}>
                {dialog === "edit" ? <EditUserForm user={user} self={self} onDone={close} /> : null}
            </Modal>

            <Modal
                open={dialog === "password"}
                onOpenChange={(o) => !o && close()}
                title="Reset password"
                description={`Sets a new password for ${user.email} and signs them out everywhere.`}
            >
                {dialog === "password" ? <ResetPasswordForm user={user} onDone={close} /> : null}
            </Modal>

            <ConfirmDialog
                open={dialog === "active"}
                onOpenChange={(o) => !o && close()}
                title={user.isActive ? `Deactivate ${user.name}?` : `Reactivate ${user.name}?`}
                description={
                    user.isActive
                        ? "They are signed out immediately and can't sign in again until reactivated. Nothing they created is removed."
                        : "They will be able to sign in again with their current password."
                }
                confirmLabel={user.isActive ? "Deactivate" : "Reactivate"}
                tone={user.isActive ? "danger" : "primary"}
                onConfirm={() => setUserActiveAction(user.id, !user.isActive)}
            />
        </>
    );
}

function EditUserForm({ user, self, onDone }) {
    const { form, onSubmit, formError, pending } = useServerForm({
        schema: updateUserSchema,
        defaultValues: { name: user.name, role: user.role },
        action: (values) => updateUserAction(user.id, values),
        onSuccess: onDone,
    });
    const { errors } = form.formState;

    return (
        <form method="post" onSubmit={onSubmit} noValidate className="space-y-4">
            <FormAlert>{formError}</FormAlert>
            <Field label="Full name" htmlFor="eu-name" error={errors.name?.message}>
                <Input autoComplete="off" {...describe("eu-name", errors.name)} {...form.register("name")} />
            </Field>
            {self ? (
                /* Not registered: the default value is submitted unchanged, and
                   the server refuses a self role change anyway. */
                <Field label="Role" htmlFor="eu-role" hint="You can't change your own role.">
                    <Input id="eu-role" value={user.role === "super_admin" ? "Super admin" : "Admin"} readOnly disabled />
                </Field>
            ) : (
                <RoleField id="eu-role" form={form} error={errors.role?.message} />
            )}
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={onDone} disabled={pending}>
                    Cancel
                </Button>
                <Button type="submit" pending={pending}>
                    Save changes
                </Button>
            </div>
        </form>
    );
}

function ResetPasswordForm({ user, onDone }) {
    const { form, onSubmit, formError, pending } = useServerForm({
        schema: resetPasswordSchema,
        defaultValues: { password: "", confirmPassword: "" },
        action: (values) => resetUserPasswordAction(user.id, values),
        onSuccess: onDone,
    });

    return (
        <form method="post" onSubmit={onSubmit} noValidate className="space-y-4">
            <FormAlert>{formError}</FormAlert>
            <PasswordFields idPrefix="rp" form={form} />
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={onDone} disabled={pending}>
                    Cancel
                </Button>
                <Button type="submit" pending={pending}>
                    Reset password
                </Button>
            </div>
        </form>
    );
}

/* ---- Shared fields ------------------------------------------------------ */

function RoleField({ id, form, error }) {
    const hint = "Super admins can also add, edit and deactivate users.";
    return (
        <Field label="Role" htmlFor={id} error={error} hint={hint}>
            <Select {...describe(id, error, hint)} {...form.register("role")}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
            </Select>
        </Field>
    );
}

/** New password + confirm, with a generator that fills both and copies. */
function PasswordFields({ idPrefix, form }) {
    const { errors } = form.formState;

    const generate = async () => {
        const value = generatePassword();
        form.setValue("password", value, { shouldValidate: true });
        form.setValue("confirmPassword", value, { shouldValidate: true });
        try {
            await navigator.clipboard.writeText(value);
            toast.success("Strong password generated and copied.");
        } catch {
            toast.success("Strong password generated. Reveal it with the eye icon to copy.");
        }
    };

    return (
        <>
            <Field
                label="Password"
                htmlFor={`${idPrefix}-password`}
                error={errors.password?.message}
                hint="At least 12 characters."
            >
                <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                        <PasswordInput
                            autoComplete="new-password"
                            {...describe(`${idPrefix}-password`, errors.password, "hint")}
                            {...form.register("password")}
                        />
                    </div>
                    <Button variant="secondary" onClick={generate} aria-label="Generate a strong password">
                        <Sparkles aria-hidden="true" />
                        <span className="hidden sm:inline">Generate</span>
                    </Button>
                </div>
            </Field>
            <Field label="Confirm password" htmlFor={`${idPrefix}-confirm`} error={errors.confirmPassword?.message}>
                <PasswordInput
                    autoComplete="new-password"
                    {...describe(`${idPrefix}-confirm`, errors.confirmPassword)}
                    {...form.register("confirmPassword")}
                />
            </Field>
        </>
    );
}

/* 16 chars from an unambiguous alphabet (no 0/O, 1/l/I), crypto RNG. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_!@#%";
function generatePassword(length = 16) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    let out = "";
    for (const byte of bytes) {
        /* Rejection sampling keeps the distribution uniform. */
        if (byte < 256 - (256 % ALPHABET.length)) out += ALPHABET[byte % ALPHABET.length];
        if (out.length === length) break;
    }
    return out.length === length ? out : generatePassword(length);
}
