"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Conversation } from "@/types/database";

/**
 * Starts (or reuses) a conversation between the current buyer and a seller
 * about a listing, then redirects into the thread. Gated to approved users.
 */
export async function startConversation(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const sellerId = String(formData.get("seller_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.id === sellerId) redirect(`/listings/${listingId}`);

  // Reuse an existing thread if there is one.
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId)
    .maybeSingle();

  let conversationId = (existing as { id: string } | null)?.id;

  if (!conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
      .select("id")
      .single();
    if (error) {
      // RLS blocks unverified users.
      redirect(`/listings/${listingId}?msg=verify`);
    }
    conversationId = (data as Conversation).id;
  }

  redirect(`/messages/${conversationId}`);
}

/** Sends a message in a conversation and bumps its last_message_at. */
export async function sendMessage(formData: FormData) {
  const conversationId = String(formData.get("conversation_id") ?? "");
  const receiverId = String(formData.get("receiver_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    receiver_id: receiverId,
    content,
  });
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/messages/${conversationId}`);
}
