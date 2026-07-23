"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/** Approve a verification. RLS + this check both require an admin. */
export async function approveVerification(formData: FormData) {
  const id = String(formData.get("verification_id") ?? "");
  const admin = await getProfile();
  if (!admin?.is_admin || !id) return;

  const supabase = await createClient();
  await supabase
    .from("verifications")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", id);

  revalidatePath("/admin/verifications");
  revalidatePath(`/admin/verifications/${id}`);
}

/** Reject a verification with a reason. */
export async function rejectVerification(formData: FormData) {
  const id = String(formData.get("verification_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Documents could not be verified.";
  const admin = await getProfile();
  if (!admin?.is_admin || !id) return;

  const supabase = await createClient();
  await supabase
    .from("verifications")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), rejection_reason: reason })
    .eq("id", id);

  revalidatePath("/admin/verifications");
  revalidatePath(`/admin/verifications/${id}`);
}
