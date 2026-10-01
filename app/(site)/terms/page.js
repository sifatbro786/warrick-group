import LegalPage from "@/components/legal/LegalPage";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("terms");
}

/* Static by design (not editable from the dashboard).
   NOTE: a plain-language baseline. Have it reviewed by the group's legal
   counsel before launch, in particular the governing-law clause. */
const SECTIONS = [
    {
        heading: "About these terms",
        paragraphs: [
            "These terms govern your use of the Warrick Group website. By using the site you accept them. If you do not accept them, please do not use the site.",
        ],
    },
    {
        heading: "Information on this site",
        paragraphs: [
            "The content of this website is provided for general information about Warrick Corporation and its operating companies. It is not an offer of securities, investment advice or a recommendation of any kind, and should not be relied on as such.",
            "We take care to keep the information accurate and current, but figures, plans and forward-looking statements can change and are given without warranty.",
        ],
    },
    {
        heading: "Intellectual property",
        paragraphs: [
            "The names, marks, text, design and images on this website belong to Warrick Corporation or its licensors. You may view and print pages for your own reference. Any other reproduction, including for commercial use, requires our written permission.",
        ],
    },
    {
        heading: "Acceptable use",
        paragraphs: [
            "You must not use the website in a way that breaks the law, interferes with its operation or security, or attempts to gain access to areas that are not open to the public. Automated submissions through the inquiry form are not permitted.",
        ],
    },
    {
        heading: "Links to other websites",
        paragraphs: [
            "Links to the websites of our operating companies and other third parties are provided for convenience. Those websites are governed by their own terms and policies, and we are not responsible for their content.",
        ],
    },
    {
        heading: "Inquiries",
        paragraphs: [
            "Submitting an inquiry does not create any contractual relationship. Do not include confidential or price-sensitive information in the inquiry form.",
        ],
    },
    {
        heading: "Liability",
        paragraphs: [
            "To the extent permitted by law, we are not liable for any loss arising from use of, or reliance on, this website or its content. Nothing in these terms limits liability that cannot be limited by law.",
        ],
    },
    {
        heading: "Changes and governing law",
        paragraphs: [
            "We may update these terms from time to time; the version on this page applies. These terms are governed by the laws of England and Wales.",
        ],
    },
];

export default function TermsPage() {
    return (
        <LegalPage
            eyebrow="Legal"
            title="Terms of Service"
            lead="The terms that govern use of the Warrick Group website and its content."
            updated="1 October 2026"
            sections={SECTIONS}
        />
    );
}
