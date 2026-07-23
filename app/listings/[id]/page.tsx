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
          <div className="mt-6 flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                {(seller?.name ?? "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  {seller?.name ?? "Seller"}
                  {seller && <VerificationBadge status={seller.verification_status} />}
                </p>
                <p className="text-xs text-muted-foreground">
                  Member since {seller ? formatDate(seller.created_at) : "—"}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {listing.view_count}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-6">
            {isOwner ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                This is your listing → manage it in your dashboard
              </Link>
            ) : (
              <ListingActions viewer={viewer} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
