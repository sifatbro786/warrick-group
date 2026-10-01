import LegalPage from "@/components/legal/LegalPage";
import { buildPageMetadata } from "@/server/services/seo";

export function generateMetadata() {
    return buildPageMetadata("privacy");
}

/* Static by design (not editable from the dashboard).
   NOTE: describes what this website technically does. Have it reviewed by
   the group's legal counsel before launch — retention periods and the
   controller's legal details are theirs to confirm. */
const SECTIONS = [
    {
        heading: "Who we are",
        paragraphs: [
            "This website is operated by Warrick Corporation on behalf of Warrick Group and its operating companies. Warrick Corporation is the controller of personal information collected through it.",
            "Questions about this policy or about your information can be sent through the contact form, choosing any desk, or by writing to the corporate desk at the address shown on the contact page.",
        ],
    },
    {
        heading: "What we collect",
        paragraphs: [
            "Browsing this website does not require you to give us any personal information. We do not run advertising or behavioural tracking on it.",
            "When you submit the inquiry form we receive your full name, email address, the desk you selected, the subject and your message. We also record a one-way hash of your network address and your browser's user-agent string; the hash cannot be turned back into your address and is used only to stop automated abuse of the form.",
        ],
    },
    {
        heading: "How we use it",
        paragraphs: [
            "Inquiry details are used to route your message to the right desk, to reply to you and to keep a record of the correspondence. We send you one automated acknowledgement with a reference number; we do not add you to any mailing list.",
            "The network-address hash is used to limit how many inquiries one connection can send in a short period.",
        ],
    },
    {
        heading: "Who we share it with",
        paragraphs: [
            "Inquiries are read by the relevant group desk and, where your message concerns one of our operating companies, may be passed to that company to answer it.",
            "We use service providers to host this website, store its data and deliver email. They process information only on our instructions. We do not sell personal information.",
        ],
    },
    {
        heading: "Third-party content",
        paragraphs: [
            "The contact page embeds a Google Maps view of one of our offices. When that map loads, Google receives your network address and may set its own cookies under its own privacy policy.",
            "Links to our operating companies' websites lead to sites with their own policies.",
        ],
    },
    {
        heading: "Cookies",
        paragraphs: [
            "The public pages of this website do not set cookies of their own. A strictly necessary session cookie is used only in the staff administration area, which is not open to the public.",
        ],
    },
    {
        heading: "How long we keep it",
        paragraphs: [
            "Inquiries are kept for as long as needed to deal with them and to keep a reasonable record of correspondence, and are then deleted. Rate-limiting records expire automatically within minutes.",
        ],
    },
    {
        heading: "Your rights",
        paragraphs: [
            "Depending on where you live, you may have the right to ask for a copy of the personal information we hold about you, to have it corrected or deleted, or to object to how it is used. To make a request, contact us through the inquiry form and quote any reference number you were given.",
            "You also have the right to complain to the data-protection authority where you live.",
        ],
    },
    {
        heading: "Changes to this policy",
        paragraphs: [
            "If we change how this website handles personal information we will update this page and the date at the top of it.",
        ],
    },
];

export default function PrivacyPage() {
    return (
        <LegalPage
            eyebrow="Legal"
            title="Privacy Policy"
            lead="How Warrick Group collects, uses and protects personal information submitted through this website."
            updated="1 October 2026"
            sections={SECTIONS}
        />
    );
}
