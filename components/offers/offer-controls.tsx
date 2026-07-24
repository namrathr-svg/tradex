"use client";

import { useState } from "react";
import {
  acceptOffer,
  counterOffer,
  declineOffer,
  withdrawOffer,
} from "@/app/offers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Offer } from "@/types/database";

export function OfferControls({ offer, meId }: { offer: Offer; meId: string }) {
  const [countering, setCountering] = useState(false);

  const isParticipant = offer.buyer_id === meId || offer.seller_id === meId;
  const live = offer.status === "pending" || offer.status === "countered";
  const myTurn = live && isParticipant && offer.last_actor_id !== meId;
  const waiting = live && offer.last_actor_id === meId;

  if (waiting) {
    return (
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">
          Waiting for a response…
        </span>
        <form action={withdrawOffer}>
          <input type="hidden" name="offer_id" value={offer.id} />
          <Button type="submit" variant="outline" size="sm">Withdraw</Button>
        </form>
      </div>
    );
  }

  if (!myTurn) return null;

  if (countering) {
    return (
      <form action={counterOffer} className="mt-3 flex items-end gap-2">
        <input type="hidden" name="offer_id" value={offer.id} />
        <div className="flex-1">
          <label className="text-xs font-bold">Your counter (₹)</label>
          <Input
            name="counter_amount"
            type="number"
            min="1"
            defaultValue={offer.offer_amount}
            autoFocus
            required
          />
        </div>
        <Button type="submit" variant="accent" size="sm">Send</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setCountering(false)}>
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <form action={acceptOffer} className="flex-1">
        <input type="hidden" name="offer_id" value={offer.id} />
        <Button type="submit" variant="lime" size="sm" className="w-full">Accept</Button>
      </form>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => setCountering(true)}
      >
        Counter
      </Button>
      <form action={declineOffer} className="flex-1">
        <input type="hidden" name="offer_id" value={offer.id} />
        <Button type="submit" variant="outline" size="sm" className="w-full">Decline</Button>
      </form>
    </div>
  );
}
