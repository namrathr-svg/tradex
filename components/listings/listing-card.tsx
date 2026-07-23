import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { CONDITION_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/types/database";

export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.image_urls?.[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card shadow-brutal-sm transition-all hover:-translate-y-1 hover:shadow-brutal"
    >
      <div className="relative aspect-square overflow-hidden border-b-2 border-border bg-secondary">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        {listing.status === "sold" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Badge variant="destructive" className="text-sm">SOLD</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {listing.brand && (
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {listing.brand}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug">
          {listing.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-lg font-extrabold">
            {formatINR(listing.price)}
          </span>
          <Badge variant="outline">{CONDITION_LABEL[listing.condition]}</Badge>
        </div>
      </div>
    </Link>
  );
}
