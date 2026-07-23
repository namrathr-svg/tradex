import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { VerifyGate } from "@/components/verification/verify-gate";
import type { Conversation, Listing, Profile } from "@/types/database";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/messages");

  if (profile.verification_status !== "approved") {
    return (
      <main className="container py-16">
        <VerifyGate feature="Messages" status={profile.verification_status} />
      </main>
    );
  }

  const supabase = await createClient();
  const uid = profile.user_id;

  const { data: convData } = await supabase
    .from("conversations")
    .select("*")
    .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
    .order("last_message_at", { ascending: false });
  const conversations = (convData ?? []) as Conversation[];

  const otherIds = [
    ...new Set(
      conversations.map((c) => (c.buyer_id === uid ? c.seller_id : c.buyer_id)),
    ),
  ];
  const listingIds = [...new Set(conversations.map((c) => c.listing_id))];

  const [{ data: profs }, { data: lists }] = await Promise.all([
    otherIds.length
      ? supabase.from("profiles").select("user_id, name").in("user_id", otherIds)
      : Promise.resolve({ data: [] }),
    listingIds.length
      ? supabase.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] }),
  ]);

  const nameById = new Map(
    ((profs ?? []) as Pick<Profile, "user_id" | "name">[]).map((p) => [p.user_id, p.name]),
  );
  const titleById = new Map(
    ((lists ?? []) as Pick<Listing, "id" | "title">[]).map((l) => [l.id, l.title]),
  );

  return (
    <main className="container max-w-2xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold">Messages</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-bold">No conversations yet</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Message a seller from any listing to start chatting.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => {
            const otherId = c.buyer_id === uid ? c.seller_id : c.buyer_id;
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-accent font-display font-extrabold text-accent-foreground">
                  {(nameById.get(otherId) ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{nameById.get(otherId) ?? "Member"}</p>
                  <p className="truncate text-sm font-medium text-muted-foreground">
                    {titleById.get(c.listing_id) ?? "Listing"}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {formatDate(c.last_message_at)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
