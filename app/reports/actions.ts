"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReportTargetType } from "@/types/database";

export type ReportState = { error: string } | { ok: true } | null;

const TARGETS: ReportTargetType[] = ["listing", "user", "message", "conversation"];

/** Files a report about a listing, user, message or conversation. */
export async function createReport(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to report." };

  const targetType = String(formData.get("target_type") ?? "") as ReportTargetType;
  const targetId = String(formData.get("target_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim() || null;

  if (!TARGETS.includes(targetType) || !targetId) return { error: "Invalid report target." };
  if (!reason) return { error: "Please pick a reason." };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details,
  });

  if (error) return { error: error.message };
  return { ok: true };
}
