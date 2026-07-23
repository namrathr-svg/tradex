import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";

/**
 * Buyer-side actions on a listing (make an offer / message the seller).
 * These are gated on verification. The offer + messaging flows themselves are
 * wired up in the next module; here we render the correct entry state.
 */
export function ListingActions({ viewer }: { viewer: Profile | null }) {
  if (!viewer) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="accent" className="flex-1">
          <Link href="/login?next=/browse">Log in to make an offer</Link>
        </Button>
      </div>
    );
  }

  if (viewer.verification_status !== "approved") {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
        <p className="font-medium">Get verified to make an offer or message the seller</p>
        <p className="mt-1 text-muted-foreground">
          Only verified members can transact — it keeps the marketplace safe.
        </p>
        <Button asChild variant="accent" size="sm" className="mt-3">
          <Link href="/verify">Get verified</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="accent" className="flex-1" disabled>
        Make an offer
      </Button>
      <Button variant="outline" className="flex-1" disabled>
        Message seller
      </Button>
      <p className="w-full text-center text-xs text-muted-foreground sm:mt-2">
        Offers &amp; messaging unlock in the next update.
      </p>
    </div>
  );
}
