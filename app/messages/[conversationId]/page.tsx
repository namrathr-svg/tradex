import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Chat } from "@/components/messages/chat";
import { VerificationBadge } from "@/components/verification/verification-badge";
import type { Conversation, Listing, Message, Profile } from "@/types/database";

export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const uid = profile.user_id;

  const { data: convData } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();
  const conversation = convData as Conversation | null;
  if (!conversation) notFound();

  const otherId =
    conversation.buyer_id === uid ? conversation.seller_id : conversation.buyer_id;

  const [{ data: msgData }, { data: otherData }, { data: listData }] =
    await Promise.all([
      supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("*").eq("user_id", otherId).single(),
      supabase
        .from("listings")
        .select("id, title")
        .eq("id", conversation.listing_id)
        .single(),
    ]);

  const messages = (msgData ?? []) as Message[];
  const other = otherData as Profile | null;
  const listing = listData as Pick<Listing, "id" | "title"> | null;

  return (
    <main className="container max-w-2xl py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/messages"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-card shadow-brutal-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-display text-lg font-extrabold">
            {other?.name ?? "Member"}
            {other && <VerificationBadge status={other.verification_status} />}
          </p>
          {listing && (
            <Link
              href={`/listings/${listing.id}`}
              className="truncate text-xs font-medium text-muted-foreground hover:underline"
            >
              Re: {listing.title}
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card shadow-brutal">
        <Chat
          conversationId={conversationId}
          meId={uid}
          otherId={otherId}
          initialMessages={messages}
        />
      </div>
    </main>
  );
}
