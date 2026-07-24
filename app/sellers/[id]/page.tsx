import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { ListingCard } from "@/components/listings/listing-card";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { Avatar } from "@/components/ui/avatar";
import type { Listing, Profile } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("name")
    .eq("user_id", id)
    .single();
  return { title: (data as Pick<Profile, "name"> | null)?.name ?? "Seller" };
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profData } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", id)
    .single();
  const seller = profData as Profile | null;
  if (!seller) notFound();

  const { data: listData } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const listings = (listData ?? []) as Listing[];

  return (
    <main className="container max-w-5xl py-10">
      {/* Cover + avatar */}
      <div className="relative mb-16 h-40 rounded-2xl border-2 border-border bg-accent shadow-brutal">
        <Avatar
          url={seller.avatar_url}
          name={seller.name}
          className="absolute -bottom-10 left-6 h-20 w-20 rounded-2xl text-3xl shadow-brutal-sm"
        />
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold">{seller.name ?? "Seller"}</h1>
        <VerificationBadge status={seller.verification_status} />
      </div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        {seller.location ? `${seller.location} · ` : ""}Member since{" "}
        {formatDate(seller.created_at)}
      </p>
      {seller.bio && (
        <p className="mb-8 max-w-2xl font-medium text-foreground">{seller.bio}</p>
      )}
      {!seller.bio && <div className="mb-8" />}

      <h2 className="mb-4 font-display text-xl font-bold">
        Listings ({listings.length})
      </h2>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <PackageOpen className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-bold">No active listings</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
