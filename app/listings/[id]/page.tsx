import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { formatINR, formatDate } from "@/lib/utils";
import { CATEGORY_LABEL, CONDITION_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { ListingActions } from "@/components/listings/listing-actions";
import { ListingManage } from "@/components/listings/listing-manage";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ReportButton } from "@/components/reports/report-button";
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
    .from("listings")
    .select("title")
    .eq("id", id)
    .single();
  return { title: (data as Pick<Listing, "title"> | null)?.title ?? "Listing" };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listingData } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  const listing = listingData as Listing | null;
  if (!listing) notFound();

  const [sellerRes, viewer] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", listing.seller_id)
      .single(),
    getProfile(),
  ]);
  const seller = sellerRes.data as Profile | null;

  // Best-effort view increment (no-op if the 0002 migration isn't applied).
  await supabase
    .rpc("increment_listing_views", { listing_id: id } as never)
    .then(
      () => {},
      () => {},
    );

  const images = listing.image_urls?.length ? listing.image_urls : [];
  const isOwner = viewer?.user_id === listing.seller_id;

  let favorited = false;
  if (viewer && !isOwner) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", viewer.user_id)
      .eq("listing_id", id)
      .maybeSingle();
    favorited = !!fav;
  }

  return (
    <main className="container max-w-5xl py-10">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
            {images[0] ? (
              <Image
                src={images[0]}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((url) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
                >
                  <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{CATEGORY_LABEL[listing.category]}</Badge>
            <Badge variant="outline">{CONDITION_LABEL[listing.condition]}</Badge>
            {listing.status === "sold" && <Badge variant="destructive">Sold</Badge>}
          </div>

          {listing.brand && (
            <p className="mt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {listing.brand}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{listing.title}</h1>
          <p className="mt-3 text-3xl font-bold">{formatINR(listing.price)}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {listing.size && (
              <div className="rounded-lg border border-border p-3">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{listing.size}</dd>
              </div>
            )}
            <div className="rounded-lg border border-border p-3">
              <dt className="text-muted-foreground">Listed</dt>
              <dd className="font-medium">{formatDate(listing.created_at)}</dd>
            </div>
          </dl>

          {listing.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold">Description</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {listing.description}
              </p>
            </div>
          )}

          {/* Seller */}
          <div className="mt-6 flex items-center justify-between rounded-2xl border-2 border-border p-4 shadow-brutal-sm">
            <Link
              href={`/sellers/${listing.seller_id}`}
              className="flex items-center gap-3 transition hover:opacity-80"
            >
              <Avatar url={seller?.avatar_url} name={seller?.name} className="h-10 w-10 text-sm" />
              <div>
                <p className="flex items-center gap-2 text-sm font-bold">
                  {seller?.name ?? "Seller"}
                  {seller && <VerificationBadge status={seller.verification_status} />}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  Member since {seller ? formatDate(seller.created_at) : "—"}
                </p>
              </div>
            </Link>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {listing.view_count}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-6">
            {isOwner ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-muted-foreground">
                  This is your listing.
                </p>
                <ListingManage id={listing.id} status={listing.status} size="default" />
              </div>
            ) : (
              <div className="space-y-3">
                <ListingActions listing={listing} viewer={viewer} />
                {viewer && (
                  <FavoriteButton
                    listingId={listing.id}
                    initialActive={favorited}
                    variant="full"
                    className="w-full"
                  />
                )}
                {viewer && (
                  <div className="pt-1">
                    <ReportButton targetType="listing" targetId={listing.id} label="Report listing" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
