import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ListingForm } from "@/components/listings/listing-form";
import type { Listing } from "@/types/database";

export const metadata: Metadata = { title: "Edit listing" };
export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=/listings/${id}/edit`);

  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("*").eq("id", id).single();
  const listing = data as Listing | null;
  if (!listing) notFound();

  // Only the owner (or an admin) may edit.
  if (listing.seller_id !== profile.user_id && !profile.is_admin) {
    redirect(`/listings/${id}`);
  }

  return (
    <main className="container max-w-2xl py-12">
      <h1 className="font-display text-3xl font-extrabold">Edit listing</h1>
      <p className="mt-1 mb-8 text-sm font-medium text-muted-foreground">
        Update your listing details, price or photos.
      </p>
      <ListingForm userId={profile.user_id} listing={listing} />
    </main>
  );
}
