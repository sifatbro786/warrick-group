import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db/connect";
import { Inquiry, SiteSettings } from "@/server/models";

/**
 * Inquiries inbox (dashboard side). The public write path stays in
 * inquiry.js; this file only reads, re-labels and deletes.
 */

export const INQUIRY_PAGE_SIZE = 20;

/** Views in the inbox tabs. "inbox" = everything not archived. */
export const INQUIRY_VIEWS = ["inbox", "new", "archived", "all"];

const STATUS_FILTER = {
    inbox: { status: mongoose.trusted({ $in: ["new", "read"] }) },
    new: { status: "new" },
    archived: { status: "archived" },
    all: {},
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @param {{ view: string, type?: string, q?: string, page: number }} params  validated by the page
 */
export async function listInquiries({ view, type, q, page }) {
    await connectDB();

    const filter = { ...STATUS_FILTER[view] };
    if (type) filter.inquiryType = type;
    if (q) {
        const pattern = mongoose.trusted({ $regex: escapeRegex(q), $options: "i" });
        filter.$or = [{ fullName: pattern }, { email: pattern }, { subject: pattern }, { reference: pattern }];
    }

    const [items, total, counts] = await Promise.all([
        Inquiry.find(filter, {
            reference: 1,
            fullName: 1,
            email: 1,
            inquiryLabel: 1,
            subject: 1,
            status: 1,
            createdAt: 1,
            "mail.error": 1,
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * INQUIRY_PAGE_SIZE)
            .limit(INQUIRY_PAGE_SIZE)
            .lean(),
        Inquiry.countDocuments(filter),
        countByStatus(),
    ]);

    return { items, total, pages: Math.max(1, Math.ceil(total / INQUIRY_PAGE_SIZE)), counts };
}

/** { new, read, archived } in one aggregate. */
export async function countByStatus() {
    await connectDB();
    const rows = await Inquiry.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
    const counts = { new: 0, read: 0, archived: 0 };
    for (const row of rows) if (row._id in counts) counts[row._id] = row.n;
    return counts;
}

export async function countNewInquiries() {
    await connectDB();
    return Inquiry.countDocuments({ status: "new" });
}

export async function getInquiry(id) {
    await connectDB();
    return Inquiry.findById(id, { "meta.ipHash": 0 }).lean();
}

/** Desk filter options — key + label only; routeTo never leaves the server. */
export async function listDesks() {
    await connectDB();
    const site = await SiteSettings.findOne({ key: "site" }, { "inquiryTypes.key": 1, "inquiryTypes.label": 1 }).lean();
    return (site?.inquiryTypes ?? []).map(({ key, label }) => ({ key, label }));
}

/** @returns {Promise<{ reference: string } | null>} */
export async function setInquiryStatus(id, status) {
    await connectDB();
    return Inquiry.findOneAndUpdate({ _id: id }, { $set: { status } }, { projection: { reference: 1 }, lean: true });
}

/** Marks a new inquiry read; no-op for anything else. */
export async function markInquiryRead(id) {
    await connectDB();
    const { modifiedCount } = await Inquiry.updateOne({ _id: id, status: "new" }, { $set: { status: "read" } });
    return modifiedCount > 0;
}

export async function deleteInquiry(id) {
    await connectDB();
    return Inquiry.findOneAndDelete({ _id: id }, { projection: { reference: 1 }, lean: true });
}
