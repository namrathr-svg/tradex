import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { setReportStatus } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Report, ReportStatus } from "@/types/database";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const TABS: ReportStatus[] = ["open", "reviewing", "resolved", "dismissed"];
const VARIANT: Record<ReportStatus, "warning" | "sky" | "success" | "default"> = {
  open: "warning",
  reviewing: "sky",
  resolved: "success",
  dismissed: "default",
};

export default async function ReportsQueue({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (TABS.includes(sp.status as ReportStatus)
    ? sp.status
    : "open") as ReportStatus;

  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  const reports = (data ?? []) as Report[];

  const targetHref = (r: Report) =>
    r.target_type === "listing"
      ? `/listings/${r.target_id}`
      : r.target_type === "user"
        ? `/sellers/${r.target_id}`
        : null;

  return (
    <main className="container max-w-3xl py-10">
      <div className="mb-6 flex items-center gap-3">
        <Flag className="h-6 w-6" />
        <h1 className="font-display text-3xl font-extrabold">Reports</h1>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link href="/admin">
            <ShieldCheck className="h-4 w-4" /> Admin home
          </Link>
        </Button>
      </div>

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-full border-2 border-border bg-card p-1 shadow-brutal-sm">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/reports?status=${t}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold capitalize transition-colors",
              status === t ? "bg-accent text-accent-foreground" : "hover:bg-secondary",
            )}
          >
            {t}
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Flag className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-bold">Nothing {status}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const href = targetHref(r);
            return (
              <div
                key={r.id}
                className="rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold capitalize">
                      {r.target_type} · {r.reason}
                    </p>
                    {r.details && (
                      <p className="mt-1 text-sm font-medium text-muted-foreground">{r.details}</p>
                    )}
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {formatDate(r.created_at)}
                      {href && (
                        <>
                          {" · "}
                          <Link href={href} className="underline">View {r.target_type}</Link>
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant={VARIANT[r.status]}>{r.status}</Badge>
                </div>

                {(r.status === "open" || r.status === "reviewing") && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBtn id={r.id} status="resolved" label="Resolve" variant="lime" />
                    <StatusBtn id={r.id} status="dismissed" label="Dismiss" variant="outline" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function StatusBtn({
  id,
  status,
  label,
  variant,
}: {
  id: string;
  status: string;
  label: string;
  variant: "lime" | "outline";
}) {
  return (
    <form action={setReportStatus}>
      <input type="hidden" name="report_id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={variant} size="sm">
        {label}
      </Button>
    </form>
  );
}
