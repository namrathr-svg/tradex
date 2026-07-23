"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Offer } from "@/types/database";

export type OfferActionState = { error: string } | null;

/** Buyer makes an offer on a listing. Gated to approved users by RLS. */
export async function createOffer(
  _prev: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const listingId = String(formData.get("listing_id") ?? "");
  const sellerId = String(formData.get("seller_id") ?? "");
  const amount = Number(formData.get("offer_amount"));

  if (!listingId || !sellerId) return { error: "Missing listing details." };
  if (user.id === sellerId) return { error: "You can't make an offer on your own listing." };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "Enter a valid offer amount." };

  const { error } = await supabase.from("offers").insert({
    listing_id: listingId,
    buyer_id: user.id,
    seller_id: sellerId,
    offer_amount: amount,
  });

  if (error) {
    if (error.code === "42501" || /row-level security/i.test(error.message))
      return { error: "Only verified members can make offers. Get verified first." };
    return { error: error.message };
  }

  revalidatePath("/offers");
  redirect("/offers?tab=sent");
}

/** Seller accepts an offer: marks it accepted, creates an order, sells the listing. */
export async function acceptOffer(formData: FormData) {
  const offerId = String(formData.get("offer_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: offerData } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .single();
  const offer = offerData as Offer | null;
  if (!offer || offer.seller_id !== user.id) return;

  await supabase.from("offers").update({ status: "accepted" }).eq("id", offerId);
  await supabase.from("orders").insert({
    listing_id: offer.listing_id,
    buyer_id: offer.buyer_id,
    seller_id: offer.seller_id,
    amount: offer.offer_amount,
  });
  await supabase.from("listings").update({ status: "sold" }).eq("id", offer.listing_id);

  revalidatePath("/offers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

/** Seller declines an offer. */
export async function declineOffer(formData: FormData) {
  const offerId = String(formData.get("offer_id") ?? "");
  const supabase = await createClient();
  await supabase.from("offers").update({ status: "declined" }).eq("id", offerId);
  revalidatePath("/offers");
}
