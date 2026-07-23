import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { formatINR, formatDate } from "@/lib/utils";
import { updateOrderStatus } from "@/app/orders/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Listing, Order, OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<OrderStatus, "warning" | "sky" | "violet" | "success" | "destructive"> = {
  pending: "warning",
  paid: "sky",
  shipped: "violet",
  completed: "success",
  disputed: "destructive",
};

export default async function OrdersPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/orders");

  const supabase = await createClient();
  const uid = profile.user_id;

  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
    .order("created_at", { ascending: false });
  const orders = (orderData ?? []) as Order[];

  const listingIds = [...new Set(orders.map((o) => o.listing_id))];
  const { data: lists } = listingIds.length
    ? await supabase.from("listings").select("id, title").in("id", listingIds)
    : { data: [] };
  const titleById = new Map(
    ((lists ?? []) as Pick<Listing, "id" | "title">[]).map((l) => [l.id, l.title]),
  );

  return (
    <main className="container max-w-2xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold">Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Receipt className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-bold">No orders yet</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Orders appear here when an offer is accepted.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const isSeller = o.seller_id === uid;
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
                      {isSeller ? "Selling" : "Buying"} · {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-extrabold">
                      {formatINR(o.amount)}
                    </p>
                    <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  {isSeller && (o.status === "pending" || o.status === "paid") && (
                    <StatusButton orderId={o.id} status="shipped" label="Mark shipped" />
                  )}
                  {!isSeller && o.status === "shipped" && (
                    <StatusButton orderId={o.id} status="completed" label="Mark received" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function StatusButton({
  orderId,
  status,
  label,
}: {
  orderId: string;
  status: OrderStatus;
  label: string;
}) {
  return (
    <form action={updateOrderStatus}>
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant="lime" size="sm">
        {label}
      </Button>
    </form>
  );
}
