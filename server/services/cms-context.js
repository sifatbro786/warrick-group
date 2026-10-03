import "server-only";
import { connectDB } from "@/server/db/connect";
import { uploadEnv } from "@/server/env";
import { Business, SiteSettings } from "@/server/models";
import { uploadsWritable } from "@/server/storage/uploads";
import { getRefOptions, refSources } from "./cms";

/**
 * Everything an editor screen passes to <CmsProvider>: options for ref
 * fields, link suggestions, and whether uploading works on this host.
 * @param {object} fields  the spec being edited
 */
export async function editorContext(fields) {
    const [refs, paths] = await Promise.all([getRefOptions(refSources(fields)), sitePaths()]);
    return { refs, paths, uploadsEnabled: uploadsWritable(), maxUploadMb: uploadEnv().UPLOAD_MAX_MB };
}

/** Public URLs that exist right now, offered as suggestions in link fields. */
async function sitePaths() {
    await connectDB();
    const [businesses, site] = await Promise.all([
        Business.find({ isPublished: true }, { slug: 1 }).sort({ order: 1 }).lean(),
        SiteSettings.findOne({ key: "site" }, { "inquiryTypes.key": 1 }).lean(),
    ]);
    return [
        "/",
        "/about",
        "/about#leadership",
        "/about#board",
        "/about#governance",
        "/businesses",
        ...businesses.map((b) => `/businesses/${b.slug}`),
        "/sustainability",
        "/sustainability#reports",
        "/innovation",
        "/news",
        "/contact",
        ...(site?.inquiryTypes ?? []).map((t) => `/contact?type=${t.key}`),
        "/privacy",
        "/terms",
    ];
}
