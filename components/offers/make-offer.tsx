"use client";

import { useActionState, useState } from "react";
import { Tag } from "lucide-react";
import { createOffer, type OfferActionState } from "@/app/offers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MakeOffer({
  listingId,
  sellerId,
  price,
}: {
  listingId: string;
  sellerId: string;
  price: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<OfferActionState, FormData>(
    createOffer,
    null,
  );

  if (!open) {
    return (
      <Button variant="accent" className="flex-1" onClick={() => setOpen(true)}>
        <Tag className="h-4 w-4" /> Make an offer
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3 rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="seller_id" value={sellerId} />
      <label className="text-sm font-bold">Your offer (₹)</label>
      <Input
        name="offer_amount"
        type="number"
        min="1"
        step="1"
        defaultValue={price}
        autoFocus
        required
      />
      {state?.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="accent" className="flex-1" disabled={pending}>
          {pending ? "Sending…" : "Send offer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
