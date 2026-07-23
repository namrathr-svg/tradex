"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ListingCategory, ListingCondition } from "@/types/database";

export type ListingFormState = { error: string } | null;

/** Updates an existing listing. RLS ensures only the owner (or admin) can. */
export async function updateListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const id = String(formData.get("listing_id") ?? "");
  if (!id) return { error: "Missing listing." };

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "") as ListingCategory;
  const condition = String(formData.get("condition") ?? "") as ListingCondition;
  const price = Number(String(formData.get("price") ?? "").trim());
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const size = String(formData.get("size") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const imageUrls = formData.getAll("image_urls").map(String).filter(Boolean);

  if (!title) return { error: "Please add a title." };
  if (!Number.isFinite(price) || price < 0)
    return { error: "Please enter a valid price." };

  const { error } = await supabase
    .from("listings")
    .update({ title, category, condition, price, brand, size, description, image_urls: imageUrls })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/listings/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/browse");
  redirect(`/listings/${id}`);
}

/** Soft-removes a listing (status = 'removed'). */
export async function removeListing(formData: FormData) {
  const id = String(formData.get("listing_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !id) return;

  await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("id", id)
    .eq("seller_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/browse");
  redirect("/dashboard");
}

/** Re-activates a removed listing. */
export async function relistListing(formData: FormData) {
  const id = String(formData.get("listing_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !id) return;

  await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", id)
    .eq("seller_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/browse");
}
