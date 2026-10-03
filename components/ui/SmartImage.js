import Image from "next/image";
import { canOptimize } from "@/lib/images";

/**
 * next/image for content-managed sources. Identical output for local files
 * and allowed hosts; for any other host it renders the plain image
 * (`unoptimized`) instead of throwing during render — an admin pasting an
 * image URL must never be able to take a page down.
 *
 * Drop-in: `import Image from "@/components/ui/SmartImage"`.
 */
export default function SmartImage({ src, unoptimized, ...props }) {
    // eslint-disable-next-line jsx-a11y/alt-text -- alt is forwarded in props
    return <Image src={src} unoptimized={unoptimized || !canOptimize(src)} {...props} />;
}
