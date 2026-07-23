import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";
import { BrowseFilters } from "@/components/listings/browse-filters";
import type { Listing, ListingCategory, ListingCondition } from "@/types/database";

export const metadata: Metadata = { title: "Browse listings" };

// Always fetch fresh listings.
export const dynamic = "force-dynamic";

type SearchParams = {
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

  if (sp.category) query = query.eq("category", sp.category as ListingCategory);
  if (sp.condition) query = query.eq("condition", sp.condition as ListingCondition);
  if (sp.min) query = query.gte("price", Number(sp.min));
  if (sp.max) query = query.lte("price", Number(sp.max));

  const { data } = await query;
  const listings = (data ?? []) as Listing[];
  const count = listings.length;

  return (
    <main className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Browse</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} {count === 1 ? "item" : "items"} found
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BrowseFilters />
        </aside>

        <section>
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <PackageOpen className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No listings match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening your search, or check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
