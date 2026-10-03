"use client";

import { createContext, useContext } from "react";

/**
 * Runtime data the field renderer needs but the spec can't hold:
 *   refs            options for `ref` fields, by source ({ categories: [...] })
 *   paths           site paths offered as suggestions in link fields
 *   uploadsEnabled  false on Vercel (read-only disk)
 *   maxUploadMb     UPLOAD_MAX_MB
 */
const CmsContext = createContext({ refs: {}, paths: [], uploadsEnabled: false, maxUploadMb: 8 });

export function CmsProvider({ value, children }) {
    return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export const useCms = () => useContext(CmsContext);
