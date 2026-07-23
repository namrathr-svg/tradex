"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ListingCategory, ListingCondition } from "@/types/database";

export type CreateListingState = { error: string } | null;

/**
 * Inserts a new listing. Image files are uploaded client-side to the
 * `listing-images` bucket first; this action only receives their public URLs
 * (a small payload, avoiding server-action body-size limits).
 *
 * RLS enforces that only verified/approved users can insert — a pending user
 * hitting this will get a permission error from Supabase.
 */
export async function createListing(
  _prev: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "") as ListingCategory;
  const condition = String(formData.get("condition") ?? "") as ListingCondition;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const size = String(formData.get("size") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const imageUrls = formData.getAll("image_urls").map(String).filter(Boolean);

  if (!title) return { error: "Please add a title." };
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0)
    return { error: "Please enter a valid price." };

  const { data, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title,
      category,
      condition,
      price,
      brand,
      size,
      description,
      image_urls: imageUrls,
    })
    .select("id")
    .single();

  if (error) {
    // A pending/unverified user trips the RLS policy here.
    if (error.code === "42501" || /row-level security/i.test(error.message)) {
      return { error: "Only verified sellers can create listings. Get verified first." };
    }
    return { error: error.message };
  }

  revalidatePath("/browse");
  revalidatePath("/dashboard");
  redirect(`/listings/${data.id}`);
}
