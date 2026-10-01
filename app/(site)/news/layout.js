/**
 * /news hosts a parallel `@modal` slot. Clicking a release on /news
 * soft-navigates to /news/[slug]; the intercepting route in
 * @modal/(.)[slug] renders it as a dialog over the grid. A direct visit,
 * refresh or crawler gets the full page at news/[slug]/page.js instead.
 */
export default function NewsLayout({ children, modal }) {
    return (
        <>
            {children}
            {modal}
        </>
    );
}
