/**
 * Renders schema.org structured data. `<` is escaped so content typed in the
 * dashboard can never close the script tag (the pattern the Next docs give).
 * Not executable script (type ld+json), so the CSP doesn't need to allow it.
 *
 * @param {{ data: object | object[] }} props
 */
export default function JsonLd({ data }) {
    if (!data) return null;
    const graph = Array.isArray(data) ? { "@context": "https://schema.org", "@graph": data } : { "@context": "https://schema.org", ...data };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />;
}
