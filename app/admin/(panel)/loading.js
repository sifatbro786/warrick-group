/** Content-area skeleton while a dashboard page loads (sidebar stays put). */
export default function Loading() {
    return (
        <div aria-busy="true" aria-label="Loading" className="animate-pulse">
            <div className="h-3 w-24 rounded bg-line" />
            <div className="mt-3 h-8 w-64 rounded bg-line" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-lg border border-line bg-surface" />
                ))}
            </div>
            <div className="mt-6 h-72 rounded-lg border border-line bg-surface" />
        </div>
    );
}
