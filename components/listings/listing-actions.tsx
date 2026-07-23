import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MakeOffer } from "@/components/offers/make-offer";
import { startConversation } from "@/app/messages/actions";
import type { Listing, Profile } from "@/types/database";

/**
 * Buyer-side actions on a listing (make an offer / message the seller).
 * Gated on verification: browsing is open, but transacting requires approval.
 */
export function ListingActions({
  listing,
  viewer,
}: {
  listing: Listing;
  viewer: Profile | null;
}) {
  if (!viewer) {
    return (
      <Button asChild variant="accent" className="w-full">
        <Link href={`/login?next=/listings/${listing.id}`}>Log in to make an offer</Link>
      </Button>
    );
  }

  if (viewer.verification_status !== "approved") {
    return (
      <div className="rounded-2xl border-2 border-border bg-accent/20 p-4 text-sm shadow-brutal-sm">
        <p className="font-bold">Get verified to make an offer or message the seller</p>
        <p className="mt-1 font-medium text-muted-foreground">
          Only verified members can transact — it keeps the marketplace safe.
        </p>
        <Button asChild variant="accent" size="sm" className="mt-3">
          <Link href="/verify">Get verified</Link>
        </Button>
      </div>
    );
  }

  const sold = listing.status !== "active";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      {sold ? (
        <p className="text-sm font-bold text-muted-foreground">
          This item is no longer available.
        </p>
      ) : (
        <MakeOffer
          listingId={listing.id}
          sellerId={listing.seller_id}
          price={listing.price}
        />
      )}
      <form action={startConversation} className="sm:w-auto">
        <input type="hidden" name="listing_id" value={listing.id} />
        <input type="hidden" name="seller_id" value={listing.seller_id} />
        <Button type="submit" variant="outline" className="w-full">
          <MessageCircle className="h-4 w-4" /> Message seller
        </Button>
      </form>
    </div>
  );
}
