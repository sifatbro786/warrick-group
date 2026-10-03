"use client";

/**
 * Upload one file to /api/admin/media with progress.
 * XMLHttpRequest rather than fetch: fetch has no upload progress events.
 *
 * @param {File} file
 * @param {{ alt?: string, onProgress?: (fraction: number) => void, signal?: AbortSignal }} [options]
 * @returns {Promise<object>} the Media record
 */
export function uploadFile(file, { alt = "", onProgress, signal } = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/media");
        /* Our CSRF marker: a cross-site page can't set custom headers. */
        xhr.setRequestHeader("X-WG-Upload", "1");
        xhr.responseType = "json";

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress?.(event.loaded / event.total);
        };
        xhr.onload = () => {
            const body = xhr.response ?? {};
            if (xhr.status === 201 && body.media) resolve(body.media);
            else if (xhr.status === 401) reject(new Error("Your session has ended. Sign in again in another tab, then retry."));
            else reject(new Error(body.message || `Upload failed (${xhr.status}).`));
        };
        xhr.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again."));
        xhr.onabort = () => reject(new DOMException("Upload cancelled.", "AbortError"));
        signal?.addEventListener("abort", () => xhr.abort(), { once: true });

        const body = new FormData();
        body.append("file", file);
        if (alt) body.append("alt", alt);
        xhr.send(body);
    });
}

export const ACCEPT = {
    image: "image/jpeg,image/png,image/webp,image/avif,image/gif",
    document: "application/pdf",
};

/** Quick client-side check so a wrong file fails before it uploads. */
export function precheck(file, accept, maxMb) {
    if (!file) return "Choose a file.";
    const allowed = accept === "document" ? ["application/pdf"] : ACCEPT.image.split(",");
    if (file.type && !allowed.includes(file.type)) {
        return accept === "document" ? "Only PDF documents can be uploaded here." : "Use a JPG, PNG, WebP, AVIF or GIF image.";
    }
    if (file.size > maxMb * 1024 * 1024) return `That file is larger than ${maxMb} MB.`;
    return null;
}

export const formatBytes = (bytes) => {
    if (bytes == null) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
