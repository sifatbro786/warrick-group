import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db/connect";
import { Article, Business, Inquiry, Leader, Office, Report, User, Venture } from "@/server/models";
import { countByStatus } from "./inquiry-admin";
import { recentActivity } from "./audit";

/** Everything the overview page shows, in one parallel round. */
export async function getOverview({ includeUsers }) {
    await connectDB();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [inquiryCounts, last30, mailFailures, recent, content, activity, users] = await Promise.all([
        countByStatus(),
        Inquiry.countDocuments({ createdAt: mongoose.trusted({ $gte: since }) }),
        Inquiry.countDocuments({ "mail.error": mongoose.trusted({ $type: "string" }), status: mongoose.trusted({ $ne: "archived" }) }),
        Inquiry.find({}, { reference: 1, fullName: 1, inquiryLabel: 1, subject: 1, status: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        Promise.all([
            Business.countDocuments(),
            Article.countDocuments({ status: "published" }),
            Article.countDocuments({ status: "draft" }),
            Venture.countDocuments(),
            Leader.countDocuments(),
            Report.countDocuments(),
            Office.countDocuments(),
        ]),
        recentActivity(8),
        includeUsers ? User.countDocuments({ isActive: true }) : Promise.resolve(null),
    ]);

    const [businesses, published, drafts, ventures, leaders, reports, offices] = content;
    return {
        inquiries: { ...inquiryCounts, last30, mailFailures },
        recent,
        content: { businesses, published, drafts, ventures, leaders, reports, offices },
        activity,
        activeUsers: users,
    };
}
