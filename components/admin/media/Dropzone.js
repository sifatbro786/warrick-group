"use client";

import { useId, useRef, useState } from "react";
import { CloudUpload, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCms } from "@/components/admin/cms/CmsContext";
import { ACCEPT, precheck, uploadFile } from "./uploadFile";

/**
 * Drop or pick files; uploads them one at a time with a progress bar.
 * Calls onUploaded(media) per finished file. Disabled (with the reason) when
 * the host can't store uploads.
 *
 * @param {{ accept?: "image"|"document"|"any", multiple?: boolean, onUploaded: (media: object) => void, compact?: boolean }} props
 */
export default function Dropzone({ accept = "image", multiple = false, onUploaded, compact = false }) {
    const { uploadsEnabled, maxUploadMb } = useCms();
    const inputId = useId();
    const inputRef = useRef(null);
    const [over, setOver] = useState(false);
    const [job, setJob] = useState(null); // { name, progress } while uploading
    const [error, setError] = useState(null);

    const acceptAttr = accept === "any" ? `${ACCEPT.image},${ACCEPT.document}` : ACCEPT[accept];

    async function handle(files) {
        setError(null);
        for (const file of Array.from(files).slice(0, multiple ? 20 : 1)) {
            const kind = accept === "any" ? (file.type === "application/pdf" ? "document" : "image") : accept;
            const problem = precheck(file, kind, maxUploadMb);
            if (problem) {
                setError(`${file.name}: ${problem}`);
                continue;
            }
            setJob({ name: file.name, progress: 0 });
            try {
                const media = await uploadFile(file, { onProgress: (progress) => setJob({ name: file.name, progress }) });
                onUploaded(media);
            } catch (err) {
                setError(`${file.name}: ${err.message}`);
            }
        }
        setJob(null);
        if (inputRef.current) inputRef.current.value = "";
    }

    if (!uploadsEnabled) {
        return (
            <div className="rounded-lg border border-dashed border-line bg-surface-soft px-5 py-6 text-center text-[13px] leading-relaxed text-ink-muted">
                Uploading is turned off on this host — Vercel&rsquo;s disk is read-only. It works on the VPS.
                <br />
                Until then, paste the address of an image hosted elsewhere.
            </div>
        );
    }

    return (
        <div>
            <label
                htmlFor={inputId}
                onDragOver={(event) => {
                    event.preventDefault();
                    setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setOver(false);
                    if (!job) handle(event.dataTransfer.files);
                }}
                className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-center transition-colors",
                    compact ? "px-4 py-5" : "px-6 py-10",
                    over ? "border-royal/50 bg-royal/[0.04]" : "border-line bg-surface-soft hover:border-royal/30",
                    job && "pointer-events-none",
                )}
            >
                {job ? (
                    <div className="w-full max-w-xs">
                        <p className="flex items-center justify-center gap-2 truncate text-[13px] text-ink">
                            <LoaderCircle className="size-4 shrink-0 animate-spin text-royal" aria-hidden="true" />
                            <span className="truncate">Uploading {job.name}</span>
                        </p>
                        <div
                            className="mt-3 h-1 overflow-hidden rounded-full bg-line"
                            role="progressbar"
                            aria-valuenow={Math.round(job.progress * 100)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Upload progress"
                        >
                            <div className="h-full bg-royal transition-[width] duration-200" style={{ width: `${Math.max(4, job.progress * 100)}%` }} />
                        </div>
                        {job.progress >= 1 ? <p className="mt-2 text-[12px] text-ink-muted">Optimising…</p> : null}
                    </div>
                ) : (
                    <>
                        <CloudUpload className="size-6 text-ink-muted" aria-hidden="true" />
                        <p className="mt-2 text-[13.5px] text-ink">
                            <span className="font-medium text-royal">Choose {multiple ? "files" : "a file"}</span> or drag {multiple ? "them" : "it"} here
                        </p>
                        <p className="mt-1 text-[12px] text-ink-muted">
                            {accept === "document" ? "PDF" : accept === "any" ? "JPG, PNG, WebP, AVIF, GIF or PDF" : "JPG, PNG, WebP, AVIF or GIF"} · up to {maxUploadMb} MB
                            {accept !== "document" ? " · location data is removed" : ""}
                        </p>
                    </>
                )}
            </label>
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={acceptAttr}
                multiple={multiple}
                className="sr-only"
                onChange={(event) => handle(event.target.files)}
                disabled={Boolean(job)}
            />
            {error ? (
                <p role="alert" className="mt-2 text-[12.5px] text-[#9b2c2c]">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
