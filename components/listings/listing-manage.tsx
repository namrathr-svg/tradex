"use client";

import Link from "next/link";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { removeListing, relistListing } from "@/app/listings/actions";
import { Button } from "@/components/ui/button";
import type { ListingStatus } from "@/types/database";

/** Owner controls for a listing: edit, remove (soft-delete) or relist. */
export function ListingManage({
  id,
  status,
  size = "sm",
}: {
  id: string;
  status: ListingStatus;
  size?: "sm" | "default";
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <Button asChild variant="outline" size={size}>
        <Link href={`/listings/${id}/edit`}>
          <Pencil className="h-4 w-4" /> Edit
        </Link>
      </Button>

      {status === "removed" ? (
        <form action={relistListing}>
          <input type="hidden" name="listing_id" value={id} />
          <Button type="submit" variant="lime" size={size}>
            <RotateCcw className="h-4 w-4" /> Relist
          </Button>
        </form>
      ) : (
        <form
          action={removeListing}
          onSubmit={(e) => {
            if (!confirm("Remove this listing? Buyers won't see it anymore.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="listing_id" value={id} />
          <Button type="submit" variant="destructive" size={size}>
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        </form>
      )}
    </div>
  );
}
