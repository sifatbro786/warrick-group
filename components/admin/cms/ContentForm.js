"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { FormProvider, useFormContext, useFormState, useWatch } from "react-hook-form";
import { CircleAlert, Undo2 } from "lucide-react";
import { formSchema, toForm } from "@/server/validators/cms/fields";
import { useServerForm } from "@/lib/admin/useServerForm";
import Button from "@/components/admin/ui/Button";
import { FormAlert } from "@/components/admin/ui/Form";
import { Panel } from "@/components/admin/ui/Panel";
import { cn } from "@/lib/cn";
import { useCms } from "./CmsContext";
import { FieldSwitch, Fields, Switch } from "./FieldRenderer";

/**
 * One editor = one spec + one save.
 * ---------------------------------------------------------------------------
 * layout="page"    sections become panels with a jump list beside them and a
 *                  sticky save bar (pages, collection records).
 * layout="inline"  a plain form with its own Save button (settings sections,
 *                  route SEO in a dialog).
 *
 * After a successful save the form's baseline becomes what was saved
 * (reset with keepValues), so "Unsaved changes" clears without remounting
 * inputs or collapsing open list rows.
 *
 * @param {{ fields: object, doc: object, onSubmit: (values: object) => Promise<object>,
 *           onSaved?: (result: object, values: object) => void, layout?: "page"|"inline",
 *           submitLabel?: string, extra?: React.ReactNode, generalLabel?: string,
 *           alwaysEnabled?: boolean, intro?: React.ReactNode, onCancel?: () => void }} props
 *   alwaysEnabled: Save is enabled without changes (create screens).
 *   intro:         rendered inside the form context above the fields
 *                  (e.g. a live search preview that watches values).
 */
export default function ContentForm({
    fields,
    doc,
    onSubmit,
    onSaved,
    layout = "page",
    submitLabel = "Save changes",
    extra = null,
    generalLabel = "Details",
    alwaysEnabled = false,
    intro = null,
    onCancel,
}) {
    const formId = useId();
    const schema = useMemo(() => formSchema(fields), [fields]);
    const [defaults] = useState(() => toForm(fields, doc ?? {}));

    const focusFirstError = () => {
        /* Two frames: collapsed rows and panels open on the error render first. */
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                const target = document.querySelector(`[data-cms-form="${formId}"] [aria-invalid="true"]`);
                if (target) {
                    target.scrollIntoView({ block: "center", behavior: "smooth" });
                    target.focus({ preventScroll: true });
                }
            }),
        );
    };

    const { form, onSubmit: submit, formError, pending } = useServerForm({
        schema,
        defaultValues: defaults,
        action: onSubmit,
        onInvalid: focusFirstError,
        onSuccess: (result, f, values) => {
            f.reset(f.getValues(), { keepValues: true });
            onSaved?.(result, values);
        },
    });

    const { isDirty } = form.formState;

    /* Leaving with unsaved edits: the browser's own confirm. */
    useEffect(() => {
        if (!isDirty) return undefined;
        const warn = (event) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [isDirty]);

    /* Ctrl/Cmd+S saves the page editor. */
    useEffect(() => {
        if (layout !== "page") return undefined;
        const onKey = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                if (!pending) submit();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [layout, pending, submit]);

    const sections = useMemo(() => (layout === "page" ? buildSections(fields, generalLabel) : null), [fields, layout, generalLabel]);

    return (
        <FormProvider {...form}>
            <form method="post" onSubmit={submit} noValidate data-cms-form={formId}>
                <SitePaths />
                {formError ? (
                    <div className="mb-5">
                        <FormAlert>{formError}</FormAlert>
                    </div>
                ) : null}
                {intro}

                {layout === "page" ? (
                    <div className="grid items-start gap-6 lg:grid-cols-[11.5rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)]">
                        <SectionNav sections={sections} />
                        <div className="min-w-0 space-y-6">
                            {sections.map((section) => (
                                <Section key={section.id} section={section} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <Fields fields={fields} />
                )}

                {layout === "page" ? (
                    <SaveBar pending={pending} submitLabel={submitLabel} extra={extra} alwaysEnabled={alwaysEnabled} />
                ) : (
                    <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                        <DirtyNote />
                        {extra}
                        {onCancel ? (
                            <Button variant="secondary" onClick={onCancel} disabled={pending}>
                                Cancel
                            </Button>
                        ) : null}
                        <Button type="submit" pending={pending} disabled={!alwaysEnabled && !isDirty}>
                            {submitLabel}
                        </Button>
                    </div>
                )}
            </form>
        </FormProvider>
    );
}

/* ---- Sections ------------------------------------------------------------ */

/**
 * Top-level groups and lists get a panel each; runs of plain fields between
 * them are gathered into one panel.
 */
function buildSections(fields, generalLabel) {
    const sections = [];
    let bucket = null;
    for (const [name, field] of Object.entries(fields)) {
        if (field.readOnly) continue;
        if (field.type === "group" || field.type === "list") {
            bucket = null;
            sections.push({ id: `sec-${name}`, kind: field.type, name, field, label: field.label, errorNames: errorNamesOf(name, field) });
        } else {
            if (!bucket) {
                bucket = { id: `sec-${name}`, kind: "bucket", fields: {}, label: null, errorNames: [] };
                sections.push(bucket);
            }
            bucket.fields[name] = field;
            bucket.errorNames.push(name);
        }
    }
    for (const section of sections) {
        if (section.kind === "bucket") {
            const entries = Object.values(section.fields);
            section.label = entries.length === 1 ? entries[0].label : generalLabel;
        }
    }
    return sections;
}

const errorNamesOf = (name, field) => (field.type === "group" && field.flatten ? Object.keys(field.fields) : [name]);

function Section({ section }) {
    const { register } = useFormContext();
    const { field, name } = section;

    let aside = null;
    let body;
    if (section.kind === "bucket") {
        body = <Fields fields={section.fields} />;
    } else if (section.kind === "list") {
        body = <FieldSwitch field={{ ...field, label: "", hint: undefined }} name={name} />;
    } else if (field.flatten) {
        body = <Fields fields={field.fields} />;
    } else if (field.nullable) {
        aside = <NullableSwitch name={name} register={register} />;
        body = <NullableBody field={field} name={name} />;
    } else {
        body = <Fields fields={field.fields} prefix={name} />;
    }

    const description = section.kind === "bucket" ? null : field.description ?? field.hint;

    return (
        <Panel id={section.id} className="scroll-mt-24">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-tight text-royal">{section.label}</h2>
                    {description ? <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p> : null}
                </div>
                {aside}
            </header>
            <div className="px-5 py-5">{body}</div>
        </Panel>
    );
}

function NullableSwitch({ name, register }) {
    const enabled = useWatch({ name: `${name}._enabled` });
    return <Switch id={`ns-${name}`} label={enabled ? "Shown" : "Hidden"} {...register(`${name}._enabled`)} />;
}

function NullableBody({ field, name }) {
    const enabled = useWatch({ name: `${name}._enabled` });
    return enabled ? (
        <Fields fields={field.fields} prefix={name} />
    ) : (
        <p className="text-[13px] text-ink-muted">Off — this band is not shown. Switch it on to edit.</p>
    );
}

function SectionNav({ sections }) {
    return (
        <nav aria-label="Sections" className="sticky top-6 hidden lg:block">
            <p className="eyebrow mb-3 !text-[10px] text-ink-muted">On this page</p>
            <ol className="space-y-0.5 border-l border-line">
                {sections.map((section) => (
                    <SectionLink key={section.id} section={section} />
                ))}
            </ol>
        </nav>
    );
}

function SectionLink({ section }) {
    const { errors } = useFormState();
    const hasErrors = section.errorNames.some((name) => name.split(".").reduce((node, key) => node?.[key], errors));
    return (
        <li>
            <a
                href={`#${section.id}`}
                className={cn(
                    "-ml-px flex items-center justify-between gap-2 border-l-2 py-1.5 pr-2 pl-3 text-[13px] transition-colors",
                    hasErrors ? "border-[#9b2c2c] text-[#9b2c2c]" : "border-transparent text-ink-muted hover:border-gold hover:text-royal",
                )}
            >
                <span className="truncate">{section.label}</span>
                {hasErrors ? <CircleAlert className="size-3.5 shrink-0" aria-label="Has errors" /> : null}
            </a>
        </li>
    );
}

/* ---- Save bar ------------------------------------------------------------ */

function SaveBar({ pending, submitLabel, extra, alwaysEnabled }) {
    const { reset } = useFormContext();
    const { isDirty, errors, isSubmitted } = useFormState();
    const errorCount = countErrors(errors);

    return (
        <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
            <div className="flex flex-wrap items-center gap-3">
                <p className="mr-auto flex items-center gap-2 text-[13px]" aria-live="polite">
                    {errorCount && isSubmitted ? (
                        <span className="flex items-center gap-1.5 text-[#9b2c2c]">
                            <CircleAlert className="size-4" aria-hidden="true" />
                            {errorCount} field{errorCount === 1 ? " needs" : "s need"} attention
                        </span>
                    ) : isDirty ? (
                        <span className="flex items-center gap-2 text-ink">
                            <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
                            Unsaved changes
                        </span>
                    ) : (
                        <span className="text-ink-muted">No unsaved changes</span>
                    )}
                    <span className="hidden text-[12px] text-ink-muted/70 xl:inline">· Ctrl+S to save</span>
                </p>
                {extra}
                {isDirty ? (
                    <Button variant="ghost" onClick={() => reset()} disabled={pending}>
                        <Undo2 aria-hidden="true" />
                        Discard
                    </Button>
                ) : null}
                <Button type="submit" pending={pending} disabled={!alwaysEnabled && !isDirty}>
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
}

function DirtyNote() {
    const { isDirty } = useFormState();
    return isDirty ? (
        <span className="mr-auto flex items-center gap-2 text-[13px] text-ink">
            <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
            Unsaved changes
        </span>
    ) : null;
}

function countErrors(node) {
    if (!node || typeof node !== "object") return 0;
    if (typeof node.message === "string" && node.type) return 1;
    return Object.entries(node).reduce((sum, [key, value]) => (key === "ref" ? sum : sum + countErrors(value)), 0);
}

/** Suggestions for every link field on the page (one shared datalist). */
function SitePaths() {
    const { paths } = useCms();
    if (!paths?.length) return null;
    return (
        <datalist id="cms-site-paths">
            {paths.map((path) => (
                <option key={path} value={path} />
            ))}
        </datalist>
    );
}
