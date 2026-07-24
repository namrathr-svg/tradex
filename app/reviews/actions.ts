"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error: string } | { ok: true } | null;

/** Leaves a review for the counterparty of a completed order. */
export async function createReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const orderId = String(formData.get("order_id") ?? "");
  const revieweeId = String(formData.get("reviewee_id") ?? "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!orderId || !revieweeId) return { error: "Missing order details." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Pick a rating from 1 to 5 stars." };

  const { error } = await supabase.from("reviews").insert({
    order_id: orderId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating,
    comment,
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already reviewed this order." };
    if (error.code === "42501" || /row-level security/i.test(error.message))
      return { error: "You can only review the other party after a completed order." };
    return { error: error.message };
  }

  revalidatePath("/orders");
  revalidatePath(`/sellers/${revieweeId}`);
  return { ok: true };
}
