"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Favorite } from "@/types/database";

/** Toggles a listing in the current user's favorites. */
export async function toggleFavorite(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  if (!listingId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if ((existing as Pick<Favorite, "id"> | null)?.id) {
    await supabase.from("favorites").delete().eq("id", (existing as Favorite).id);
  } else {
    await supabase
      .from("favorites")
      .insert({ user_id: user.id, listing_id: listingId });
  }

  revalidatePath("/favorites");
  revalidatePath(`/listings/${listingId}`);
}
