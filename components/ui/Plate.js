import Image from "@/components/ui/SmartImage";
import { cn } from "@/lib/cn";

/**
 * Editorial photograph in a fixed-ratio frame, optimised by next/image.
 *
 * Replaces the React site's `<img class="aspect-4/5 w-full object-cover">`
 * plus veil span. The ratio moves to the wrapper (next/image `fill` needs a
 * sized, positioned parent); everything else — saturation, hover zoom, the
 * royal veil — keeps its original class.
 *
 * @param {object} props
 * @param {{ url: string, alt?: string, focal?: string }} props.image
 * @param {string} props.ratio        aspect class, e.g. "aspect-4/5"
 * @param {string} props.sizes        responsive sizes hint
 * @param {string} [props.alt]        overrides image.alt
 * @param {string} [props.imgClass]   extra classes on the <img>
 * @param {string} [props.veil]       veil class, e.g. "bg-royal-deep/8"; omit for none
 * @param {string} [props.className]  wrapper classes
 * @param {boolean} [props.priority]  above-the-fold image
 * @param {number} [props.quality]
 */
export default function Plate({
    image,
    ratio,
    sizes,
    alt,
    imgClass,
    veil,
    className,
    priority = false,
    quality = 75,
}) {
    if (!image?.url) return null;

    return (
        <div className={cn("relative w-full overflow-hidden", ratio, className)}>
            <Image
                src={image.url}
                alt={alt ?? image.alt ?? ""}
                fill
                sizes={sizes}
                quality={quality}
                preload={priority}
                loading={priority ? "eager" : "lazy"}
                style={{ objectPosition: image.focal || "center" }}
                className={cn("object-cover", imgClass)}
            />
            {veil ? (
                <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0", veil)} />
            ) : null}
        </div>
    );
}
