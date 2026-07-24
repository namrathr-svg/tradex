import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { ReportButton } from "@/components/reports/report-button";
import { ListingCard } from "@/components/listings/listing-card";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/reviews/star-rating";
import type { Listing, Profile, Review } from "@/types/database";

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

  const [{ data: listData }, { data: revData }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("seller_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_id", id)
      .order("created_at", { ascending: false }),
  ]);
  const listings = (listData ?? []) as Listing[];
  const reviews = (revData ?? []) as Review[];
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
    : 0;

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const { data: rprofs } = reviewerIds.length
    ? await supabase.from("profiles").select("user_id, name").in("user_id", reviewerIds)
    : { data: [] };
  const reviewerName = new Map(
    ((rprofs ?? []) as Pick<Profile, "user_id" | "name">[]).map((p) => [p.user_id, p.name]),
  );

  const viewer = await getUser();
  const canReport = viewer && viewer.id !== id;

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
        {reviewCount > 0 && <StarRating value={avgRating} count={reviewCount} />}
      </div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        {seller.location ? `${seller.location} · ` : ""}Member since{" "}
        {formatDate(seller.created_at)}
      </p>
      {seller.bio && (
        <p className="mb-4 max-w-2xl font-medium text-foreground">{seller.bio}</p>
      )}
      {canReport && (
        <div className="mb-8">
          <ReportButton targetType="user" targetId={id} label="Report this seller" />
        </div>
      )}
      {!canReport && <div className="mb-8" />}

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

      {reviewCount > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-xl font-bold">
            Reviews ({reviewCount})
          </h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{reviewerName.get(r.reviewer_id) ?? "Member"}</p>
                  <StarRating value={r.rating} />
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{r.comment}</p>
                )}
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {formatDate(r.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
