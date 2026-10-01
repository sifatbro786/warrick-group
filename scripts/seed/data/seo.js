/**
 * Per-route SEO (server/models/SeoSetting.js). Edited from the dashboard's
 * SEO page. Titles ≤ 60 chars (the template adds " | Warrick Group"),
 * descriptions ≤ 160 chars. Home uses the full title without the template.
 */
export default [
    {
        key: "home",
        path: "/",
        label: "Home",
        title: "Warrick Group — Energy, Consumer Technology & Mobility",
        description:
            "A privately held group across energy infrastructure, consumer technology and advanced mobility, committing capital on a decade view.",
        keywords: ["Warrick Group", "Warrick Corporation", "Clara", "Warrick Motors", "holding company"],
        sitemap: { include: true, changeFrequency: "weekly", priority: 1 },
    },
    {
        key: "about",
        path: "/about",
        label: "About Us",
        title: "About the Group — Leadership & Governance",
        description:
            "Founded in 1998, Warrick Corporation holds assets for decades, not quarters. Meet the founders, executive leadership and board.",
        keywords: ["Warrick Corporation history", "leadership", "board of directors", "governance"],
        sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
    },
    {
        key: "businesses",
        path: "/businesses",
        label: "Our Businesses",
        title: "Our Businesses — Clara & Warrick Motors",
        description:
            "Three companies, one balance sheet. Capital is committed centrally; hiring, product and market strategy belong to each operating company.",
        keywords: ["Clara", "Warrick Motors", "operating companies"],
        sitemap: { include: true, changeFrequency: "monthly", priority: 0.9 },
    },
    {
        key: "sustainability",
        path: "/sustainability",
        label: "Sustainability",
        title: "Sustainability — Net Zero by 2035",
        description:
            "One reduction path across every operating company, measured against a 2019 baseline and independently verified. Roadmap, ESG metrics and reports.",
        keywords: ["net zero 2035", "ESG", "sustainability report", "emissions"],
        sitemap: { include: true, changeFrequency: "monthly", priority: 0.8 },
    },
    {
        key: "innovation",
        path: "/innovation",
        label: "Innovation",
        title: "Innovation — Engineering Judged on the Road",
        description:
            "Group-funded research in grid storage, commercial powertrain, commerce platforms and materials recovery — each sponsored by a company that will use it.",
        keywords: ["research and development", "powertrain", "energy storage", "innovation"],
        sitemap: { include: true, changeFrequency: "monthly", priority: 0.7 },
    },
    {
        key: "news",
        path: "/news",
        label: "News",
        title: "Newsroom & Group Insights",
        description:
            "Official announcements, results and commentary from Warrick Corporation and its operating companies.",
        keywords: ["press releases", "Warrick news", "announcements"],
        sitemap: { include: true, changeFrequency: "weekly", priority: 0.8 },
    },
    {
        key: "contact",
        path: "/contact",
        label: "Contact",
        title: "Contact — Corporate, Investor & Media Inquiries",
        description:
            "Partnership proposals, shareholder questions and press enquiries. Formal inquiries receive a response within two working days.",
        keywords: ["contact Warrick Group", "investor relations", "media inquiries"],
        sitemap: { include: true, changeFrequency: "yearly", priority: 0.6 },
    },
    {
        key: "privacy",
        path: "/privacy",
        label: "Privacy Policy",
        title: "Privacy Policy",
        description: "How Warrick Group collects, uses and protects personal information submitted through this website.",
        sitemap: { include: true, changeFrequency: "yearly", priority: 0.3 },
    },
    {
        key: "terms",
        path: "/terms",
        label: "Terms of Service",
        title: "Terms of Service",
        description: "The terms that govern use of the Warrick Group website and its content.",
        sitemap: { include: true, changeFrequency: "yearly", priority: 0.3 },
    },
];
