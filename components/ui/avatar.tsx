import Image from "next/image";
import { cn } from "@/lib/utils";

/** Round avatar showing the user's photo, or their initial as a fallback. */
export function Avatar({
  url,
  name,
  className,
}: {
  url?: string | null;
  name?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-secondary font-display font-extrabold",
        className,
      )}
    >
      {url ? (
        <Image src={url} alt={name ?? ""} fill sizes="80px" className="object-cover" />
      ) : (
        (name ?? "U").charAt(0).toUpperCase()
      )}
    </div>
  );
}
