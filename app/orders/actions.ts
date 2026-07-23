"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/database";

const ALLOWED: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "disputed",
];

/** Advances an order's status. RLS ensures only participants can update it. */
export async function updateOrderStatus(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!orderId || !ALLOWED.includes(status)) return;

  const supabase = await createClient();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}
