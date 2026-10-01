/* Shown only while a page that is not yet cached renders on the server
   (normally every page is prerendered, so this is rare). Static by design:
   a single gold hairline drawing across under the header. */
export default function Loading() {
    return (
        <div role="status" aria-live="polite" className="bg-surface-soft">
            <span className="sr-only">Loading</span>
            <div aria-hidden="true" className="h-px w-full overflow-hidden bg-line">
                <span className="block h-px w-1/3 animate-[loading-rule_1.2s_var(--ease-premium)_infinite] bg-gold" />
            </div>
            <div className="min-h-[60vh]" />
        </div>
    );
}
