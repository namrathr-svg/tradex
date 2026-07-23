"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type VerifyState = { error: string } | null;

/**
 * Records a verification submission. The selfie + ID photos are uploaded
 * client-side to the private `verification-docs` bucket first; this action
 * receives only their storage paths. Inserting the row flips the user's
 * profile to `pending` (via the sync trigger) for an admin to review.
 */
export async function submitVerification(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const idType = String(formData.get("id_type") ?? "").trim();
  const idNumber = String(formData.get("id_number") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const selfiePath = String(formData.get("selfie_path") ?? "");
  const idPhotoPath = String(formData.get("id_photo_path") ?? "");

  if (!idType) return { error: "Select an ID type." };
  if (!idNumber) return { error: "Enter your ID number." };
  if (!selfiePath) return { error: "Upload a selfie." };
  if (!idPhotoPath) return { error: "Upload a photo of your ID." };

  const { error } = await supabase.from("verifications").insert({
    user_id: user.id,
    id_type: idType,
    id_number: idNumber,
    address,
    selfie_url: selfiePath,
    id_photo_url: idPhotoPath,
  });

  if (error) return { error: error.message };

  revalidatePath("/verify");
  revalidatePath("/dashboard");
  redirect("/verify?submitted=1");
}
