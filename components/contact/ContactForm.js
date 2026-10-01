"use client";

import { useId, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Rise } from "@/components/motion/Reveal";
import { submitInquiry } from "@/server/actions/contact";

/* Field chrome. One bottom hairline, no box, no fill; the rule goes gold on
   focus and the browser focus ring stays on top of it. */
const FIELD =
    "w-full appearance-none border-b border-line bg-transparent pb-3 text-[15px] text-royal transition-colors duration-500 ease-premium placeholder:text-ink-muted/45 focus:border-gold-dark";

/* The only off-palette value on the page: error text has to read as one. */
const ERROR_TEXT = "text-[13px] leading-relaxed text-[#9b2c2c]";

const EMPTY_FORM = { fullName: "", email: "", inquiryType: "", subject: "", message: "", website: "" };

/* Client-side rules, mirrored from server/validators/contact.js so people are
   not told about a typo by a round trip. The server decides. */
function validate(values) {
    const errors = {};
    if (!values.fullName.trim()) errors.fullName = "Enter your full name.";
    if (!values.email.trim()) {
        errors.email = "Enter a corporate email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
        errors.email = "That email address does not look complete.";
    }
    if (!values.inquiryType) errors.inquiryType = "Select an inquiry type.";
    if (!values.subject.trim()) errors.subject = "Add a subject line.";
    if (values.message.trim().length < 20) {
        errors.message = "Give us at least a couple of sentences to route this properly.";
    }
    return errors;
}

function FieldShell({ id, label, error, children }) {
    return (
        <div>
            <label
                htmlFor={id}
                className="eyebrow block text-ink-muted transition-colors duration-500 ease-premium"
            >
                {label}
            </label>
            <div className="mt-4">{children}</div>
            {error ? (
                <p id={`${id}-error`} role="alert" className={`mt-3 ${ERROR_TEXT}`}>
                    {error}
                </p>
            ) : null}
        </div>
    );
}

/**
 * Reads ?type= so the home page's "Investor Relations" / "Media" rows land
 * with the right desk selected. Kept in its own component behind <Suspense>
 * (see the contact page) so the rest of the page still prerenders.
 */
export function ContactFormWithParams({ copy, inquiryTypes }) {
    const type = useSearchParams().get("type") ?? "";
    const preset = inquiryTypes.some((t) => t.key === type) ? type : "";
    return <ContactForm key={preset} copy={copy} inquiryTypes={inquiryTypes} preset={preset} />;
}

/**
 * The formal inquiry form — ported 1:1 from ContactPage.jsx, now posting to
 * the `submitInquiry` Server Action.
 *
 * @param {{ copy: object, inquiryTypes: Array<{key: string, label: string}>, preset?: string }} props
 */
export default function ContactForm({ copy = {}, inquiryTypes, preset = "" }) {
    const fieldId = useId();
    const [values, setValues] = useState({ ...EMPTY_FORM, inquiryType: preset });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState("idle"); // idle | success | error
    const [serverMessage, setServerMessage] = useState(null);
    const [reference, setReference] = useState(null);
    const [pending, startTransition] = useTransition();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((current) => ({ ...current, [name]: value }));
        /* Clear a field's error as soon as the user starts fixing it. */
        setErrors((current) => {
            if (!current[name]) return current;
            const next = { ...current };
            delete next[name];
            return next;
        });
    };

    const focusFirst = (nextErrors) => {
        const first = Object.keys(nextErrors)[0];
        if (first) document.getElementById(`${fieldId}-${first}`)?.focus();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const nextErrors = validate(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            focusFirst(nextErrors);
            return;
        }

        setServerMessage(null);
        startTransition(async () => {
            try {
                const result = await submitInquiry(values);
                if (result.status === "success") {
                    setReference(result.reference);
                    setStatus("success");
                    setValues({ ...EMPTY_FORM });
                } else if (result.status === "invalid") {
                    setErrors(result.errors);
                    setStatus("idle");
                    focusFirst(result.errors);
                } else {
                    setServerMessage(result.message ?? null);
                    setStatus("error");
                }
            } catch {
                setStatus("error");
            }
        });
    };

    const resetForm = () => {
        setStatus("idle");
        setReference(null);
        setErrors({});
        setServerMessage(null);
    };

    const describedBy = (field) => (errors[field] ? `${fieldId}-${field}-error` : undefined);

    if (status === "success") {
        /* Confirmation replaces the form: a submitted form left on screen
           invites a second send. */
        return (
            <Rise role="status" className="mt-14 border-t border-line pt-12">
                <p className="font-display text-[22px] leading-snug font-bold text-royal">
                    {copy.successTitle}
                </p>
                <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.85] text-ink-muted">
                    {copy.successBody}
                </p>
                {reference ? (
                    <p className="eyebrow mt-8 text-ink-muted">
                        Reference <span className="text-royal tabular-nums">{reference}</span>
                    </p>
                ) : null}
                <button
                    type="button"
                    onClick={resetForm}
                    className="group mt-12 inline-flex items-center gap-4 border-b border-line pb-2 transition-colors duration-500 ease-premium hover:border-gold"
                >
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-royal uppercase">
                        Submit Another Inquiry
                    </span>
                    <span
                        aria-hidden="true"
                        className="text-gold-dark transition-transform duration-500 ease-premium group-hover:translate-x-1.5"
                    >
                        &rarr;
                    </span>
                </button>
            </Rise>
        );
    }

    return (
        <Rise as="form" noValidate onSubmit={handleSubmit} className="mt-14 border-t border-line pt-14">
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
                <FieldShell id={`${fieldId}-fullName`} label="Full Name *" error={errors.fullName}>
                    <input
                        id={`${fieldId}-fullName`}
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        maxLength={120}
                        value={values.fullName}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.fullName)}
                        aria-describedby={describedBy("fullName")}
                        className={FIELD}
                    />
                </FieldShell>

                <FieldShell id={`${fieldId}-email`} label="Corporate Email *" error={errors.email}>
                    <input
                        id={`${fieldId}-email`}
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        maxLength={254}
                        value={values.email}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={describedBy("email")}
                        className={FIELD}
                    />
                </FieldShell>

                <FieldShell id={`${fieldId}-inquiryType`} label="Inquiry Type *" error={errors.inquiryType}>
                    {/* The native control, restyled rather than replaced. */}
                    <div className="relative">
                        <select
                            id={`${fieldId}-inquiryType`}
                            name="inquiryType"
                            value={values.inquiryType}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.inquiryType)}
                            aria-describedby={describedBy("inquiryType")}
                            className={`${FIELD} cursor-pointer pr-8 ${values.inquiryType ? "" : "text-ink-muted/60"}`}
                        >
                            <option value="">Select a desk</option>
                            {inquiryTypes.map((type) => (
                                <option key={type.key} value={type.key}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0 bottom-3 text-[11px] text-gold-dark"
                        >
                            &#9662;
                        </span>
                    </div>
                </FieldShell>

                <FieldShell id={`${fieldId}-subject`} label="Subject *" error={errors.subject}>
                    <input
                        id={`${fieldId}-subject`}
                        name="subject"
                        type="text"
                        maxLength={200}
                        value={values.subject}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.subject)}
                        aria-describedby={describedBy("subject")}
                        className={FIELD}
                    />
                </FieldShell>

                <div className="sm:col-span-2">
                    <FieldShell id={`${fieldId}-message`} label="Message *" error={errors.message}>
                        <textarea
                            id={`${fieldId}-message`}
                            name="message"
                            rows={5}
                            maxLength={5000}
                            value={values.message}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.message)}
                            aria-describedby={describedBy("message")}
                            className={`${FIELD} resize-y`}
                        />
                    </FieldShell>
                </div>

                {/* Honeypot: off-screen, out of the tab order, ignored by
                    assistive tech. Only bots fill it. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor={`${fieldId}-website`}>Website</label>
                    <input
                        id={`${fieldId}-website`}
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={values.website}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {status === "error" ? (
                <p role="alert" className={`mt-10 ${ERROR_TEXT}`}>
                    {serverMessage ?? copy.errorBody}
                </p>
            ) : null}

            <div className="mt-14 flex flex-col gap-8 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-[38ch] text-[13px] leading-relaxed text-ink-muted">{copy.note}</p>

                <button
                    type="submit"
                    disabled={pending}
                    className="group inline-flex shrink-0 items-center justify-center gap-4 rounded-xs bg-royal px-9 py-4.5 text-[11px] font-semibold tracking-[0.2em] text-gold uppercase transition-all duration-500 ease-premium hover:bg-royal-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {pending ? copy.submittingLabel : copy.submitLabel}
                    <span
                        aria-hidden="true"
                        className="transition-transform duration-500 ease-premium group-hover:translate-x-1.5"
                    >
                        &rarr;
                    </span>
                </button>
            </div>
        </Rise>
    );
}
