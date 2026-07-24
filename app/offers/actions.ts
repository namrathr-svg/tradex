"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Offer } from "@/types/database";

export type OfferActionState = { error: string } | null;

async function loadOffer(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, offer: null as Offer | null };
  const { data } = await supabase.from("offers").select("*").eq("id", id).single();
  return { supabase, user, offer: data as Offer | null };
}

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
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid offer amount." };

  const { error } = await supabase.from("offers").insert({
    listing_id: listingId,
    buyer_id: user.id,
    seller_id: sellerId,
    offer_amount: amount,
    last_actor_id: user.id,
  });

  if (error) {
    if (error.code === "42501" || /row-level security/i.test(error.message))
      return { error: "Only verified members can make offers. Get verified first." };
    return { error: error.message };
  }

  revalidatePath("/offers");
  redirect("/offers?tab=sent");
}

/** Accept the other party's current proposal: creates an order, sells the listing. */
export async function acceptOffer(formData: FormData) {
  const id = String(formData.get("offer_id") ?? "");
  const { supabase, user, offer } = await loadOffer(id);
  if (!user || !offer) return;

  const isParticipant = offer.buyer_id === user.id || offer.seller_id === user.id;
  // You can only accept a proposal the *other* side made.
  if (!isParticipant || offer.last_actor_id === user.id) return;
  if (!["pending", "countered"].includes(offer.status)) return;

  await supabase.from("offers").update({ status: "accepted" }).eq("id", id);
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

/** Counter the other party's proposal with a new amount. */
export async function counterOffer(formData: FormData) {
  const id = String(formData.get("offer_id") ?? "");
  const amount = Number(formData.get("counter_amount"));
  const { supabase, user, offer } = await loadOffer(id);
  if (!user || !offer) return;

  const isParticipant = offer.buyer_id === user.id || offer.seller_id === user.id;
  if (!isParticipant || offer.last_actor_id === user.id) return;
  if (!["pending", "countered"].includes(offer.status)) return;
  if (!Number.isFinite(amount) || amount <= 0) return;

  await supabase
    .from("offers")
    .update({ offer_amount: amount, status: "countered", last_actor_id: user.id })
    .eq("id", id);

  revalidatePath("/offers");
}

/** Decline the offer (either party). */
export async function declineOffer(formData: FormData) {
  const id = String(formData.get("offer_id") ?? "");
  const supabase = await createClient();
  await supabase.from("offers").update({ status: "declined" }).eq("id", id);
  revalidatePath("/offers");
}

/** Withdraw your own outstanding proposal. */
export async function withdrawOffer(formData: FormData) {
  const id = String(formData.get("offer_id") ?? "");
  const { supabase, user, offer } = await loadOffer(id);
  if (!user || !offer) return;
  if (offer.last_actor_id !== user.id) return;
  if (!["pending", "countered"].includes(offer.status)) return;

  await supabase.from("offers").update({ status: "withdrawn" }).eq("id", id);
  revalidatePath("/offers");
}
