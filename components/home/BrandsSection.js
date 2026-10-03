import { Rise, Stagger } from "@/components/motion/Reveal";
import { itemKey } from "@/lib/format";

/* ==========================================================================
   BrandsSection (React: BrandLogosSection). Typographic wordmarks, no boxes
   and no dividers between marks — a logo strip earns its calm from space.
   ========================================================================== */
export default function BrandsSection({ heading = {}, items = [] }) {
    const rise = { y: 20, duration: 0.75 };

    return (
        <section aria-labelledby="entities-heading" className="border-t border-line bg-surface-soft">
            <div className="mx-auto max-w-360 px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
                <Stagger stagger={0.09}>
                    <Rise as="p" {...rise} className="eyebrow text-gold-dark">
                        {heading.eyebrow}
                    </Rise>

                    <Rise
                        as="h2"
                        {...rise}
                        id="entities-heading"
                        className="mt-6 max-w-[18ch] text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.15] font-bold text-royal"
                    >
                        {heading.title}
                    </Rise>

                    {/* Grayscale and held back at half opacity so the marks read
                        as a group rather than six competing signatures. */}
                    <Rise
                        as="ul"
                        {...rise}
                        className="mt-16 grid grid-cols-2 items-center gap-x-8 gap-y-12 border-t border-line pt-16 sm:grid-cols-3 lg:mt-20 lg:grid-cols-6 lg:gap-x-10"
                    >
                        {items.map((brand, index) => (
                            <li key={itemKey(brand, index)} className="text-center">
                                <span className="inline-block text-[13px] leading-tight font-bold tracking-[0.16em] whitespace-nowrap text-ink uppercase opacity-50 transition-opacity duration-500 ease-premium hover:opacity-100">
                                    {brand.name}
                                </span>
                            </li>
                        ))}
                    </Rise>
                </Stagger>
            </div>
        </section>
    );
}
