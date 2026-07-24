import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { VerifyGate } from "@/components/verification/verify-gate";
import { OfferControls } from "@/components/offers/offer-controls";
import { Badge } from "@/components/ui/badge";
import type { Listing, Offer, OfferStatus, Profile } from "@/types/database";

export const metadata: Metadata = { title: "Offers" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<OfferStatus, "warning" | "success" | "destructive" | "sky" | "default"> = {
  pending: "warning",
  countered: "sky",
  accepted: "success",
  declined: "destructive",
  withdrawn: "default",
};

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/offers");

  if (profile.verification_status !== "approved") {
    return (
      <main className="container py-16">
        <VerifyGate feature="Offers" status={profile.verification_status} />
      </main>
    );
  }

  const tab = (await searchParams).tab === "sent" ? "sent" : "received";
  const supabase = await createClient();
  const uid = profile.user_id;

  const { data: offerData } = await supabase
    .from("offers")
    .select("*")
    .eq(tab === "received" ? "seller_id" : "buyer_id", uid)
    .order("created_at", { ascending: false });
  const offers = (offerData ?? []) as Offer[];

  const listingIds = [...new Set(offers.map((o) => o.listing_id))];
  const otherIds = [
    ...new Set(offers.map((o) => (tab === "received" ? o.buyer_id : o.seller_id))),
  ];

  const [{ data: lists }, { data: profs }] = await Promise.all([
    listingIds.length
      ? supabase.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    otherIds.length
      ? supabase.from("profiles").select("user_id, name").in("user_id", otherIds)
      : Promise.resolve({ data: [] }),
  ]);

  const titleById = new Map(
    ((lists ?? []) as Pick<Listing, "id" | "title">[]).map((l) => [l.id, l.title]),
  );
  const nameById = new Map(
    ((profs ?? []) as Pick<Profile, "user_id" | "name">[]).map((p) => [p.user_id, p.name]),
  );

  return (
    <main className="container max-w-2xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold">Offers</h1>

      <div className="mb-6 inline-flex gap-1 rounded-full border-2 border-border bg-card p-1 shadow-brutal-sm">
        <TabLink active={tab === "received"} href="/offers?tab=received">Received</TabLink>
        <TabLink active={tab === "sent"} href="/offers?tab=sent">Sent</TabLink>
      </div>

      {offers.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-bold">No {tab} offers yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => {
            const otherId = tab === "received" ? o.buyer_id : o.seller_id;
            const live = o.status === "pending" || o.status === "countered";
            const whose = live
              ? o.last_actor_id === uid
                ? "Your offer"
                : "Their offer"
              : null;
            return (
              <div
                key={o.id}
                className="rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/listings/${o.listing_id}`}
                      className="truncate font-bold hover:underline"
                    >
                      {titleById.get(o.listing_id) ?? "Listing"}
                    </Link>
                    <p className="text-sm font-medium text-muted-foreground">
                      {tab === "received" ? "From" : "To"} {nameById.get(otherId) ?? "Member"} ·{" "}
                      {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-extrabold">
                      {formatINR(o.offer_amount)}
                    </p>
                    <Badge variant={STATUS_VARIANT[o.status]}>
                      {whose ?? o.status}
                    </Badge>
                  </div>
                </div>

                <OfferControls offer={o} meId={uid} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}
