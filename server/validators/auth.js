import { z } from "zod";
import { emailField, singleLine } from "./_shared.js";

/**
 * Auth and account schemas (login, password, profile, users).
 * Shared by the admin forms (client feedback) and the Server Actions (truth).
 */

/** Policy for passwords set from the dashboard. The seed bypasses it. */
export const PASSWORD_MIN_LENGTH = 12;
/* argon2 accepts any length; the cap stops a 1 MB "password" from being
   hashed on every login attempt. */
const PASSWORD_MAX_LENGTH = 128;

export const ROLE_VALUES = /** @type {const} */ (["super_admin", "admin"]);

/** Login checks presence only: the seeded password predates the policy. */
export const loginSchema = z.object({
    email: emailField,
    password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH, "Incorrect email or password."),
});

export const newPassword = z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(PASSWORD_MAX_LENGTH, `Keep it under ${PASSWORD_MAX_LENGTH} characters.`)
    .refine((value) => new Set(value).size >= 5, "Too repetitive — mix in more characters.");

const withConfirm = (shape) =>
    z.object(shape).refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "The two passwords don't match.",
    });

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Enter your current password.").max(PASSWORD_MAX_LENGTH),
        password: newPassword,
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "The two passwords don't match.",
    })
    .refine((d) => d.password !== d.currentPassword, {
        path: ["password"],
        message: "Choose a password you haven't used here.",
    });

export const profileSchema = z.object({
    name: singleLine(80, "Enter your name.").min(2, "Enter your name."),
});

export const createUserSchema = withConfirm({
    name: singleLine(80, "Enter a name.").min(2, "Enter a name."),
    email: emailField,
    role: z.enum(ROLE_VALUES, { error: "Choose a role." }),
    password: newPassword,
    confirmPassword: z.string(),
});

export const updateUserSchema = z.object({
    name: singleLine(80, "Enter a name.").min(2, "Enter a name."),
    role: z.enum(ROLE_VALUES, { error: "Choose a role." }),
});

export const resetPasswordSchema = withConfirm({
    password: newPassword,
    confirmPassword: z.string(),
});
