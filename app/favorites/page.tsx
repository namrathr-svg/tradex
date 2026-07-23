import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ListingCard } from "@/components/listings/listing-card";
import type { Favorite, Listing } from "@/types/database";

export const metadata: Metadata = { title: "Favorites" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/favorites");

  const supabase = await createClient();
  const { data: favs } = await supabase
    .from("favorites")
    .select("listing_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ids = ((favs ?? []) as Pick<Favorite, "listing_id">[]).map((f) => f.listing_id);
  const { data: listData } = ids.length
    ? await supabase.from("listings").select("*").in("id", ids)
    : { data: [] };
  const byId = new Map(((listData ?? []) as Listing[]).map((l) => [l.id, l]));
  // Preserve favorite order (most-recently saved first).
  const listings = ids.map((id) => byId.get(id)).filter(Boolean) as Listing[];

  return (
    <main className="container py-10">
      <h1 className="mb-6 flex items-center gap-2 font-display text-3xl font-extrabold">
        <Heart className="h-7 w-7 fill-pop-pink text-pop-pink" /> Favorites
      </h1>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
          <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-bold">No favorites yet</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Tap the heart on any listing to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} showFavorite favorited />
          ))}
        </div>
      )}
    </main>
  );
}
