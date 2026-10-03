import Plate from "@/components/ui/Plate";
import { Rise, Stagger } from "@/components/motion/Reveal";
import { pad, itemKey } from "@/lib/format";

/* ==========================================================================
   CommitmentSection (React: ValuesESGSection). Tall plate left, commitments
   stacked right. The photograph is pulled back with desaturation and a
   faint royal veil so it sits in the page's muted palette.
   ========================================================================== */
export default function CommitmentSection({ heading = {}, image, values = [] }) {
    return (
        <section aria-labelledby="commitment-heading" className="border-t border-line bg-surface">
            <Stagger className="mx-auto grid max-w-360 gap-x-8 gap-y-14 px-5 py-24 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-x-16 lg:px-10 lg:py-32">
                {/* ---------------- Plate ---------------- */}
                {image?.url ? (
                    <Rise as="figure" className="relative overflow-hidden lg:col-span-5">
                        <Plate
                            image={image}
                            ratio="aspect-4/5"
                            sizes="(min-width: 64rem) 40vw, 100vw"
                            quality={70}
                            imgClass="saturate-[0.72]"
                            veil="bg-royal-deep/12"
                        />
                    </Rise>
                ) : null}

                {/* ---------------- Commitments ---------------- */}
                <div className="lg:col-span-6 lg:col-start-7">
                    <Rise as="p" className="eyebrow text-gold-dark">
                        {heading.eyebrow}
                    </Rise>

                    <Rise
                        as="h2"
                        id="commitment-heading"
                        className="mt-6 max-w-[18ch] text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.15] font-bold text-royal"
                    >
                        {heading.title}
                    </Rise>

                    <dl className="mt-12">
                        {values.map((value, index) => (
                            <Rise
                                key={itemKey(value, index)}
                                className="border-t border-line py-9 last:pb-0"
                            >
                                <dt className="flex items-baseline gap-5">
                                    <span className="eyebrow text-ink-muted/60">{pad(index + 1)}</span>
                                    <span className="text-[18px] font-bold text-royal">{value.title}</span>
                                </dt>
                                <dd className="mt-4 max-w-[52ch] pl-[calc(2ch+1.25rem)] text-[14px] leading-[1.8] text-ink-muted">
                                    {value.detail}
                                </dd>
                            </Rise>
                        ))}
                    </dl>
                </div>
            </Stagger>
        </section>
    );
}
