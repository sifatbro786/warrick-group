"use client";

import { useState } from "react";
import { get, useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
import { ChevronDown, ChevronUp, CircleAlert, Copy, Crosshair, FileText, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { emptyItem } from "@/server/validators/cms/fields";
import Button from "@/components/admin/ui/Button";
import { describe, Field, Input, Select, Textarea } from "@/components/admin/ui/Form";
import MediaPicker from "@/components/admin/media/MediaPicker";
import { formatBytes } from "@/components/admin/media/uploadFile";
import { cn } from "@/lib/cn";
import { useCms } from "./CmsContext";

/**
 * Renders a spec (server/validators/cms) inside a react-hook-form context.
 * ---------------------------------------------------------------------------
 * Plain inputs use register() (uncontrolled, so a 200-field page stays fast);
 * only the image picker, list rows and counters subscribe to values.
 * Field names are the dotted paths the Zod schema reports errors on, so
 * client and server errors land on the same input.
 */

const SPAN = {
    full: "col-span-6",
    half: "col-span-6 sm:col-span-3",
    third: "col-span-6 sm:col-span-2",
};

const idFor = (name) => `f-${name.replace(/\./g, "-")}`;
const join = (prefix, name) => (prefix ? `${prefix}.${name}` : name);

/** Message for a field, including array-level ("Add at least 1."). */
function useFieldError(name) {
    const { errors } = useFormState({ name });
    const error = get(errors, name);
    return error?.message ?? error?.root?.message ?? null;
}

/** Any error at or under `name` (for collapsed rows and section markers). */
export function useHasErrors(name) {
    const { errors } = useFormState({ name });
    return Boolean(get(errors, name));
}

/**
 * A field tree. `prefix` is the dotted path of the parent object.
 * @param {{ fields: Record<string, any>, prefix?: string }} props
 */
export function Fields({ fields, prefix = "" }) {
    return (
        <div className="grid grid-cols-6 gap-x-4 gap-y-5">
            {Object.entries(fields).map(([name, field]) => {
                if (field.readOnly) return null;
                if (field.type === "group" && field.flatten) {
                    return (
                        <div key={name} className="col-span-6">
                            <GroupFrame field={field}>
                                <Fields fields={field.fields} prefix={prefix} />
                            </GroupFrame>
                        </div>
                    );
                }
                const full = ["group", "list", "image", "paragraphs"].includes(field.type);
                return (
                    <div key={name} className={full ? SPAN.full : SPAN[field.span ?? "full"]}>
                        <FieldSwitch field={field} name={join(prefix, name)} />
                    </div>
                );
            })}
        </div>
    );
}

export function FieldSwitch({ field, name }) {
    switch (field.type) {
        case "text":
        case "link":
            return <TextField field={field} name={name} />;
        case "textarea":
        case "lines":
        case "paragraphs":
            return <TextareaField field={field} name={name} />;
        case "number":
            return <NumberField field={field} name={name} />;
        case "date":
            return <DateField field={field} name={name} />;
        case "toggle":
            return <ToggleField field={field} name={name} />;
        case "select":
        case "ref":
            return <SelectField field={field} name={name} />;
        case "image":
            return <ImageField field={field} name={name} />;
        case "file":
            return <FileField field={field} name={name} />;
        case "group":
            return <GroupField field={field} name={name} />;
        case "list":
            return <ListField field={field} name={name} />;
        default:
            return null;
    }
}

/* ---- Simple inputs ------------------------------------------------------- */

function Label({ field }) {
    return (
        <>
            {field.label}
            {field.required ? (
                <span className="ml-0.5 text-gold-dark" aria-hidden="true">
                    *
                </span>
            ) : null}
        </>
    );
}

function TextField({ field, name }) {
    const { register, setValue, getValues } = useFormContext();
    const { paths } = useCms();
    const error = useFieldError(name);
    const id = idFor(name);

    /* "Generate from name" for slugs/keys. */
    const generate = field.slugFrom
        ? () => {
              const parent = name.split(".").slice(0, -1).join(".");
              const source = getValues(join(parent, field.slugFrom)) ?? "";
              setValue(name, slugify(source), { shouldDirty: true, shouldValidate: true });
          }
        : null;

    return (
        <Field label={<Label field={field} />} htmlFor={id} error={error} hint={field.hint}>
            <div className={generate ? "flex gap-2" : undefined}>
                <Input
                    {...describe(id, error, field.hint)}
                    {...register(name)}
                    maxLength={field.max}
                    placeholder={field.placeholder ?? (field.type === "link" ? "/about or https://…" : undefined)}
                    spellCheck={field.mono || field.type === "link" ? false : undefined}
                    autoComplete="off"
                    list={field.type === "link" && paths?.length ? "cms-site-paths" : undefined}
                    className={cn(field.mono && "font-mono text-[13px]")}
                />
                {generate ? (
                    <Button variant="secondary" onClick={generate} className="shrink-0" aria-label={`Generate ${field.label.toLowerCase()} from ${field.slugFrom}`}>
                        Generate
                    </Button>
                ) : null}
            </div>
            {field.counter ? <Counter name={name} range={field.counter} max={field.max} /> : null}
        </Field>
    );
}

function TextareaField({ field, name }) {
    const { register } = useFormContext();
    const error = useFieldError(name);
    const id = idFor(name);
    const listy = field.type === "lines" || field.type === "paragraphs";

    return (
        <Field label={<Label field={field} />} htmlFor={id} error={error} hint={field.hint}>
            <Textarea
                {...describe(id, error, field.hint)}
                {...register(name)}
                rows={field.rows}
                maxLength={listy ? undefined : field.max}
                className={cn("min-h-0", field.type === "paragraphs" && "leading-[1.7]")}
            />
            {field.counter ? <Counter name={name} range={field.counter} max={field.max} /> : null}
            {listy ? <ItemCount name={name} kind={field.type} /> : null}
        </Field>
    );
}

function NumberField({ field, name }) {
    const { register } = useFormContext();
    const error = useFieldError(name);
    const id = idFor(name);
    return (
        <Field label={<Label field={field} />} htmlFor={id} error={error} hint={field.hint}>
            <Input
                type="number"
                inputMode={field.int ? "numeric" : "decimal"}
                step={field.step ?? (field.int ? 1 : "any")}
                min={field.min}
                max={field.max}
                {...describe(id, error, field.hint)}
                {...register(name)}
                className="tabular-nums"
            />
        </Field>
    );
}

function DateField({ field, name }) {
    const { register } = useFormContext();
    const error = useFieldError(name);
    const id = idFor(name);
    return (
        <Field label={<Label field={field} />} htmlFor={id} error={error} hint={field.hint}>
            <Input type="date" {...describe(id, error, field.hint)} {...register(name)} />
        </Field>
    );
}

function SelectField({ field, name }) {
    const { register } = useFormContext();
    const { refs } = useCms();
    const error = useFieldError(name);
    const id = idFor(name);
    const options = field.type === "ref" ? refs?.[field.source] ?? [] : field.options;

    return (
        <Field label={<Label field={field} />} htmlFor={id} error={error} hint={field.hint}>
            <Select {...describe(id, error, field.hint)} {...register(name)}>
                {field.type === "ref" ? <option value="">{field.required ? "Choose…" : "— None —"}</option> : null}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
        </Field>
    );
}

export function ToggleField({ field, name }) {
    const { register } = useFormContext();
    const id = idFor(name);
    return <Switch id={id} label={field.label} hint={field.hint} {...register(name)} />;
}

/** Checkbox styled as a switch. Forwards register() props. */
export function Switch({ id, label, hint, className, ...props }) {
    return (
        <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3", className)}>
            <input id={id} type="checkbox" className="peer sr-only" aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
            <span
                aria-hidden="true"
                className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-line transition-colors duration-200 peer-checked:bg-royal peer-focus-visible:shadow-[0_0_0_3px_rgb(46_26_71/0.18)] after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 after:content-[''] peer-checked:after:translate-x-4"
            />
            <span className="min-w-0">
                <span className="block text-[13.5px] font-medium text-ink">{label}</span>
                {hint ? (
                    <span id={`${id}-hint`} className="mt-0.5 block text-[12.5px] leading-snug text-ink-muted">
                        {hint}
                    </span>
                ) : null}
            </span>
        </label>
    );
}

/* ---- Counters ------------------------------------------------------------ */

/** "52 / 60" — gold inside the ideal range, muted outside it. */
function Counter({ name, range: [low, high], max }) {
    const value = useWatch({ name }) ?? "";
    const length = String(value).trim().length;
    const state = length === 0 ? "empty" : length < low ? "short" : length > high ? "long" : "ok";
    return (
        <p className="mt-1 flex justify-between text-[12px] text-ink-muted" aria-live="polite">
            <span>
                {state === "short" ? `A little short — aim for ${low}–${high}.` : state === "long" ? `May be cut off after ~${high}.` : state === "ok" ? "Good length." : ""}
            </span>
            <span className={cn("tabular-nums", state === "ok" && "text-[#2f6b45]", state === "long" && "text-gold-dark")}>
                {length} / {max}
            </span>
        </p>
    );
}

function ItemCount({ name, kind }) {
    const value = useWatch({ name }) ?? "";
    const raw = String(value);
    const count = (kind === "paragraphs" ? raw.split(/\n\s*\n/) : raw.split(/\r?\n/)).filter((part) => part.trim()).length;
    const noun = kind === "paragraphs" ? "paragraph" : "item";
    return (
        <p className="mt-1 text-right text-[12px] text-ink-muted tabular-nums">
            {count} {noun}
            {count === 1 ? "" : "s"}
        </p>
    );
}

/* ---- Image --------------------------------------------------------------- */

function ImageField({ field, name }) {
    const { register, setValue } = useFormContext();
    const url = useWatch({ name: `${name}.url` });
    const focal = useWatch({ name: `${name}.focal` });
    const urlError = useFieldError(`${name}.url`);
    const groupError = useFieldError(name);
    const error = urlError ?? groupError;
    const [picking, setPicking] = useState(false);
    const id = idFor(name);
    const opts = { shouldDirty: true, shouldValidate: true };

    const pick = ({ url: next, alt }) => {
        setValue(`${name}.url`, next, opts);
        setValue(`${name}.focal`, "center", opts);
        if (alt) setValue(`${name}.alt`, alt, opts);
    };

    const setFocal = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
        setValue(`${name}.focal`, `${clamp(x)}% ${clamp(y)}%`, opts);
    };

    const [fx, fy] = parseFocal(focal);

    /* min-w-0: a fieldset defaults to min-width: min-content and would push
       the page wider than a phone. */
    return (
        <fieldset className="min-w-0 space-y-3" aria-describedby={error ? `${id}-error` : undefined}>
            <legend className="mb-1.5 text-[13px] font-medium text-ink">
                <Label field={field} />
            </legend>
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="w-full shrink-0 sm:w-56">
                    {url ? (
                        <button
                            type="button"
                            onClick={setFocal}
                            className="group relative block aspect-4/3 w-full cursor-crosshair overflow-hidden rounded-md border border-line bg-surface-card"
                            aria-label="Set the focal point: click the part of the image that must stay in frame"
                            title="Click to set the focal point"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any source */}
                            <img src={url} alt="" className="h-full w-full object-cover" style={{ objectPosition: focal || "center" }} />
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
                                style={{ left: `${fx}%`, top: `${fy}%` }}
                            />
                            <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-royal-night/70 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <Crosshair className="size-3" aria-hidden="true" /> Click to set focal point
                            </span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setPicking(true)}
                            className={cn(
                                "flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-surface-soft text-[13px] text-ink-muted transition-colors hover:border-royal/30 hover:text-royal",
                                error ? "border-[#9b2c2c]/50" : "border-line",
                            )}
                        >
                            <ImagePlus className="size-5" aria-hidden="true" />
                            Choose image
                        </button>
                    )}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setPicking(true)}>
                            <ImagePlus aria-hidden="true" />
                            {url ? "Replace" : "Choose"}
                        </Button>
                        {url && !field.required ? (
                            <Button variant="ghost" size="sm" onClick={() => setValue(`${name}.url`, "", opts)}>
                                <X aria-hidden="true" />
                                Remove
                            </Button>
                        ) : null}
                    </div>
                    {url ? <p className="truncate font-mono text-[11.5px] text-ink-muted" title={url}>{url}</p> : null}
                    <Field
                        label="Alt text"
                        htmlFor={`${id}-alt`}
                        hint="Describe the image for screen readers. Leave empty if it is purely decorative."
                    >
                        <Input id={`${id}-alt`} {...register(`${name}.alt`)} maxLength={300} />
                    </Field>
                    <input type="hidden" {...register(`${name}.focal`)} />
                    {field.hint ? <p className="text-[12.5px] text-ink-muted">{field.hint}</p> : null}
                </div>
            </div>
            {error ? (
                <p id={`${id}-error`} role="alert" className="text-[12.5px] text-[#9b2c2c]">
                    {error}
                </p>
            ) : null}
            {/* The url lives in a visually hidden input: it carries the value and
                aria-invalid, so "jump to first error" can land on this field. */}
            <input type="text" tabIndex={-1} aria-hidden="true" aria-invalid={error ? true : undefined} className="sr-only" {...register(`${name}.url`)} />
            <MediaPicker open={picking} onOpenChange={setPicking} accept="image" onSelect={pick} />
        </fieldset>
    );
}

const clamp = (n) => Math.min(100, Math.max(0, n));
function parseFocal(value = "center") {
    const words = { left: 0, top: 0, center: 50, right: 100, bottom: 100 };
    const parts = String(value || "center").trim().split(/\s+/);
    const read = (part) => (part?.endsWith("%") ? parseFloat(part) : words[part] ?? 50);
    return [read(parts[0]), read(parts[1] ?? "center")];
}

/* ---- File (PDF, logo) ---------------------------------------------------- */

function FileField({ field, name }) {
    const { register, setValue, getValues } = useFormContext();
    const error = useFieldError(name);
    const url = useWatch({ name });
    const [picking, setPicking] = useState(false);
    const id = idFor(name);

    const pick = ({ url: next, size }) => {
        setValue(name, next, { shouldDirty: true, shouldValidate: true });
        /* Reports: fill "File size" from the upload when it is empty. */
        if (field.fillSize && size) {
            const sibling = join(name.split(".").slice(0, -1).join("."), field.fillSize);
            if (!getValues(sibling)) setValue(sibling, formatBytes(size), { shouldDirty: true });
        }
    };

    return (
        <Field label={<Label field={field} />} htmlFor={id} error={error} hint={field.hint}>
            <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                    {field.accept === "image" && url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin preview
                        <img src={url} alt="" className="pointer-events-none absolute top-1/2 left-2 size-6 -translate-y-1/2 rounded-sm object-contain" />
                    ) : field.accept === "document" ? (
                        <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                    ) : null}
                    <Input
                        {...describe(id, error, field.hint)}
                        {...register(name)}
                        className={cn("font-mono text-[13px]", (field.accept === "document" || url) && "pl-10")}
                        placeholder="/uploads/… or https://…"
                        spellCheck={false}
                        autoComplete="off"
                    />
                </div>
                <Button variant="secondary" onClick={() => setPicking(true)} className="shrink-0">
                    Choose…
                </Button>
            </div>
            <MediaPicker open={picking} onOpenChange={setPicking} accept={field.accept === "image" ? "image" : "document"} onSelect={pick} />
        </Field>
    );
}

/* ---- Group --------------------------------------------------------------- */

function GroupFrame({ field, children, aside }) {
    return (
        <fieldset className="min-w-0 rounded-md border border-line bg-surface-soft/60 px-4 pt-3 pb-5 sm:px-5">
            <legend className="sr-only">{field.label}</legend>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-royal">{field.label}</p>
                    {field.description ? <p className="mt-0.5 text-[12.5px] text-ink-muted">{field.description}</p> : null}
                </div>
                {aside}
            </div>
            {children}
        </fieldset>
    );
}

function GroupField({ field, name }) {
    const { register } = useFormContext();
    const enabled = useWatch({ name: `${name}._enabled` });
    const hasErrors = useHasErrors(name);

    if (field.collapsible) {
        return (
            <details className="group/details rounded-md border border-line bg-surface-soft/60" open={hasErrors || undefined}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                        <span className="block text-[13.5px] font-semibold text-royal">{field.label}</span>
                        {field.description ? <span className="mt-0.5 block text-[12.5px] text-ink-muted">{field.description}</span> : null}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-ink-muted transition-transform group-open/details:rotate-180" aria-hidden="true" />
                </summary>
                <div className="border-t border-line px-4 pt-4 pb-5 sm:px-5">
                    <Fields fields={field.fields} prefix={name} />
                </div>
            </details>
        );
    }

    if (field.nullable) {
        const id = idFor(`${name}._enabled`);
        return (
            <GroupFrame field={field} aside={<Switch id={id} label={enabled ? "On" : "Off"} {...register(`${name}._enabled`)} />}>
                {enabled ? <Fields fields={field.fields} prefix={name} /> : null}
            </GroupFrame>
        );
    }

    return (
        <GroupFrame field={field}>
            <Fields fields={field.fields} prefix={name} />
        </GroupFrame>
    );
}

/* ---- List ---------------------------------------------------------------- */

function ListField({ field, name }) {
    const { control, getValues } = useFormContext();
    const { fields: rows, append, remove, move, insert } = useFieldArray({ control, name });
    const error = useFieldError(name);
    /* Rows that existed on load start collapsed; rows added since start open.
       `toggled` flips either default. Ids survive the post-save reset
       (ContentForm resets with keepValues), so nothing re-expands on save. */
    const [initialIds] = useState(() => new Set(rows.map((row) => row.id)));
    const [toggled, setToggled] = useState(() => new Set());
    const noun = field.itemLabel ?? "item";
    const full = rows.length >= field.max;
    const isOpen = (id) => (initialIds.has(id) ? toggled.has(id) : !toggled.has(id));

    const toggle = (id) =>
        setToggled((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const add = () => {
        append(emptyItem(field.fields), { shouldFocus: false });
    };

    return (
        <section aria-label={field.label}>
            <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                    <p className="text-[13px] font-medium text-ink">
                        <Label field={field} />
                        <span className="ml-2 font-normal text-ink-muted tabular-nums">{rows.length}</span>
                    </p>
                    {field.hint ? <p className="mt-0.5 text-[12.5px] text-ink-muted">{field.hint}</p> : null}
                </div>
            </div>

            {rows.length ? (
                <ol className="space-y-2">
                    {rows.map((row, index) => (
                        <ListRow
                            key={row.id}
                            field={field}
                            name={`${name}.${index}`}
                            index={index}
                            count={rows.length}
                            open={isOpen(row.id)}
                            onToggle={() => toggle(row.id)}
                            onMove={(to) => move(index, to)}
                            onRemove={() => remove(index)}
                            onDuplicate={full ? null : () => insert(index + 1, structuredClone(getValues(`${name}.${index}`)))}
                        />
                    ))}
                </ol>
            ) : (
                <p className="rounded-md border border-dashed border-line px-4 py-5 text-center text-[13px] text-ink-muted">
                    No {noun.toLowerCase()}s yet.
                </p>
            )}

            {error ? (
                <p role="alert" className="mt-2 text-[12.5px] text-[#9b2c2c]">
                    {error}
                </p>
            ) : null}

            <Button variant="secondary" size="sm" className="mt-3" onClick={add} disabled={full}>
                <Plus aria-hidden="true" />
                Add {noun.toLowerCase()}
            </Button>
            {full ? <span className="ml-3 text-[12px] text-ink-muted">Maximum {field.max}.</span> : null}
        </section>
    );
}

function ListRow({ field, name, index, count, open, onToggle, onMove, onRemove, onDuplicate }) {
    const hasErrors = useHasErrors(name);
    const values = useWatch({ name });
    const summaryKeys = [field.summary ?? Object.keys(field.fields)[0]].flat();
    const summary = summaryKeys
        .map((key) => values?.[key])
        .filter((v) => v !== undefined && v !== null && String(v).trim())
        .join(" · ");
    const expanded = open || hasErrors;
    const bodyId = `${idFor(name)}-body`;

    return (
        <li className={cn("rounded-md border bg-surface", hasErrors ? "border-[#9b2c2c]/40" : "border-line")}>
            <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-3">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={expanded}
                    aria-controls={bodyId}
                    className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
                >
                    <span className="w-6 shrink-0 text-[12px] text-ink-muted tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                    <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", summary ? "text-ink" : "text-ink-muted italic")}>
                        {summary || `New ${(field.itemLabel ?? "item").toLowerCase()}`}
                    </span>
                    {hasErrors ? <CircleAlert className="size-4 shrink-0 text-[#9b2c2c]" aria-label="Has errors" /> : null}
                    <ChevronDown className={cn("size-4 shrink-0 text-ink-muted transition-transform", expanded && "rotate-180")} aria-hidden="true" />
                </button>
                <div className="flex shrink-0 items-center">
                    <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)} icon={ChevronUp} />
                    <IconButton label="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)} icon={ChevronDown} />
                    {onDuplicate ? <IconButton label="Duplicate" onClick={onDuplicate} icon={Copy} className="hidden sm:flex" /> : null}
                    <IconButton label="Remove" onClick={onRemove} icon={Trash2} danger />
                </div>
            </div>
            {/* Collapsed rows stay mounted: their inputs keep their values and errors. */}
            <div id={bodyId} hidden={!expanded} className="border-t border-line px-4 pt-4 pb-5">
                <Fields fields={field.fields} prefix={name} />
            </div>
        </li>
    );
}

function IconButton({ label, icon: Icon, danger, className, ...props }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                "flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors disabled:pointer-events-none disabled:opacity-30",
                danger ? "hover:bg-[#9b2c2c]/8 hover:text-[#9b2c2c]" : "hover:bg-surface-card hover:text-royal",
                className,
            )}
            {...props}
        >
            <Icon className="size-4" aria-hidden="true" />
        </button>
    );
}

/* ---- Helpers ------------------------------------------------------------- */

export function slugify(value) {
    return String(value)
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);
}
