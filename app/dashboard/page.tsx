import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  Tag,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { formatINR, formatDate } from "@/lib/utils";
import { CONDITION_LABEL } from "@/lib/constants";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Listing, Offer, Order } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const uid = profile.user_id;

  const [listingsRes, offersRes, ordersRes] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("seller_id", uid)
      .order("created_at", { ascending: false }),
    supabase.from("offers").select("id, status").eq("seller_id", uid),
    supabase.from("orders").select("amount, status").eq("seller_id", uid),
  ]);

  const listings = (listingsRes.data ?? []) as Listing[];
  const offers = (offersRes.data ?? []) as Pick<Offer, "status">[];
  const orders = (ordersRes.data ?? []) as Pick<Order, "amount" | "status">[];

  const activeListings = listings.filter((l) => l.status === "active").length;
  const pendingOffers = offers.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "completed");
  const revenue = completedOrders.reduce((sum, o) => sum + Number(o.amount), 0);
  const totalSales = completedOrders.length;

  const isApproved = profile.verification_status === "approved";

  return (
    <main className="container py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {profile.name ?? "trader"}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {profile.email}
            <VerificationBadge status={profile.verification_status} />
          </p>
        </div>
        {isApproved && (
          <Button asChild variant="accent">
            <Link href="/sell">
              <Plus className="h-4 w-4" /> New listing
            </Link>
          </Button>
        )}
      </div>

      {/* Verify prompt */}
      {!isApproved && (
        <Card className="mb-8 border-accent/40 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base">Get verified to unlock selling</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Upload a selfie, a government ID and your address to start listing,
              messaging and making offers.
            </p>
            <Button asChild variant="accent">
              <Link href="/verify">Start verification</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatINR(revenue)} icon={IndianRupee} />
        <StatCard label="Active listings" value={activeListings} icon={Tag} />
        <StatCard label="Total sales" value={totalSales} icon={ShoppingBag} />
        <StatCard label="Pending offers" value={pendingOffers} icon={Package} />
      </div>

      {/* Listings management */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your listings</h2>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Package className="mb-3 h-9 w-9 text-muted-foreground" />
          <p className="font-medium">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isApproved
              ? "Create your first listing to start selling."
              : "Get verified, then create your first listing."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="flex items-center gap-4 p-4 transition hover:bg-secondary/50"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {l.image_urls?.[0] && (
                  <Image src={l.image_urls[0]} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  {CONDITION_LABEL[l.condition]} · Listed {formatDate(l.created_at)}
                </p>
              </div>
              <span className="text-sm font-semibold">{formatINR(l.price)}</span>
              <Badge
                variant={
                  l.status === "active"
                    ? "success"
                    : l.status === "sold"
                      ? "default"
                      : "outline"
                }
              >
                {l.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
