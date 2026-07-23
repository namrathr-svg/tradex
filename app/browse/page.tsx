import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ListingCard } from "@/components/listings/listing-card";
import { BrowseFilters } from "@/components/listings/browse-filters";
import { SearchBar } from "@/components/listings/search-bar";
import type { Favorite, Listing, ListingCategory, ListingCondition } from "@/types/database";

export const metadata: Metadata = { title: "Browse listings" };
export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  category?: string;
  condition?: string;
  min?: string;
  max?: string;
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (sp.q) query = query.or(`title.ilike.%${sp.q}%,brand.ilike.%${sp.q}%`);
  if (sp.category) query = query.eq("category", sp.category as ListingCategory);
  if (sp.condition) query = query.eq("condition", sp.condition as ListingCondition);
  if (sp.min) query = query.gte("price", Number(sp.min));
  if (sp.max) query = query.lte("price", Number(sp.max));

  const { data } = await query;
  const listings = (data ?? []) as Listing[];
  const count = listings.length;

  // Mark favorites for logged-in users.
  const user = await getUser();
  let favoritedIds = new Set<string>();
  if (user && count > 0) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id);
    favoritedIds = new Set(
      ((favs ?? []) as Pick<Favorite, "listing_id">[]).map((f) => f.listing_id),
    );
  }

  return (
    <main className="container py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold">Browse</h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {count} {count === 1 ? "item" : "items"} found
        </p>
      </div>

      <div className="mb-8">
        <SearchBar />
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BrowseFilters />
        </aside>

        <section>
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
              <PackageOpen className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-bold">No listings match your search</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Try widening your filters, or check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showFavorite={!!user}
                  favorited={favoritedIds.has(listing.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
