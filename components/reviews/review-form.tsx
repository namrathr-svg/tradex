"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { createReview, type ReviewState } from "@/app/reviews/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({
  orderId,
  revieweeId,
  revieweeName,
}: {
  orderId: string;
  revieweeId: string;
  revieweeName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    createReview,
    null,
  );

  if (state && "ok" in state) {
    return (
      <p className="mt-3 rounded-xl border-2 border-border bg-pop-lime/20 px-3 py-2 text-sm font-bold">
        Thanks for your review! ⭐
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-xl border-2 border-border bg-secondary/40 p-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="reviewee_id" value={revieweeId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="text-sm font-bold">Rate {revieweeName}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-7 w-7 transition",
                (hover || rating) >= i ? "fill-accent text-accent" : "fill-muted text-muted",
              )}
            />
          </button>
        ))}
      </div>

      <Textarea name="comment" placeholder="How was the deal? (optional)" className="min-h-[60px]" />

      {state && "error" in state && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      <Button type="submit" variant="accent" size="sm" disabled={pending || rating === 0}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
