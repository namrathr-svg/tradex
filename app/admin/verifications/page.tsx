import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatDate, maskIdNumber, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Profile, Verification, VerificationStatus } from "@/types/database";

export const metadata: Metadata = { title: "Verification queue" };
export const dynamic = "force-dynamic";

const TABS: VerificationStatus[] = ["pending", "approved", "rejected"];
const STATUS_VARIANT: Record<VerificationStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export default async function VerificationQueue({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (TABS.includes(sp.status as VerificationStatus)
    ? sp.status
    : "pending") as VerificationStatus;

  const supabase = await createClient();
  const { data: verifData } = await supabase
    .from("verifications")
    .select("*")
    .eq("status", status)
    .order("submitted_at", { ascending: false });
  const verifications = (verifData ?? []) as Verification[];

  const userIds = [...new Set(verifications.map((v) => v.user_id))];
  const { data: profs } = userIds.length
    ? await supabase.from("profiles").select("user_id, name, email").in("user_id", userIds)
    : { data: [] };
  const byId = new Map(
    ((profs ?? []) as Pick<Profile, "user_id" | "name" | "email">[]).map((p) => [
      p.user_id,
      p,
    ]),
  );

  return (
    <main className="container max-w-3xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold">Verification queue</h1>

      <div className="mb-6 inline-flex gap-1 rounded-full border-2 border-border bg-card p-1 shadow-brutal-sm">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/verifications?status=${t}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold capitalize transition-colors",
              status === t ? "bg-accent text-accent-foreground" : "hover:bg-secondary",
            )}
          >
            {t}
          </Link>
        ))}
      </div>

      {verifications.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-bold">Nothing {status} right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => {
            const p = byId.get(v.user_id);
            return (
              <Link
                key={v.id}
                href={`/admin/verifications/${v.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{p?.name ?? "Member"}</p>
                  <p className="truncate text-sm font-medium text-muted-foreground">
                    {p?.email} · {v.id_type} · {maskIdNumber(v.id_number)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={STATUS_VARIANT[v.status]}>{v.status}</Badge>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {formatDate(v.submitted_at)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
