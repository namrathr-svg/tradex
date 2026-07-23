import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { ListingForm } from "@/components/listings/listing-form";
import { VerifyGate } from "@/components/verification/verify-gate";

export const metadata: Metadata = { title: "Sell an item" };

export default async function SellPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/sell");

  return (
    <main className="container max-w-2xl py-12">
      <h1 className="text-2xl font-bold tracking-tight">Sell an item</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        List your sneakers, streetwear or collectibles for buyers to discover.
      </p>

      {profile.verification_status === "approved" ? (
        <ListingForm userId={profile.user_id} />
      ) : (
        <VerifyGate feature="Selling" status={profile.verification_status} />
      )}
    </main>
  );
}
