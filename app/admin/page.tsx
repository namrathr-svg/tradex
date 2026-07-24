import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Users, Tag, Clock, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const supabase = await createClient();

  const [pendingVerif, totalUsers, activeListings, openReports] = await Promise.all([
    supabase
      .from("verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  return (
    <main className="container py-12">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7" />
        <h1 className="font-display text-3xl font-extrabold">Admin</h1>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending reviews" value={pendingVerif.count ?? 0} icon={Clock} />
        <StatCard label="Open reports" value={openReports.count ?? 0} icon={Flag} />
        <StatCard label="Total users" value={totalUsers.count ?? 0} icon={Users} />
        <StatCard label="Active listings" value={activeListings.count ?? 0} icon={Tag} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification review</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Review identity submissions and approve or reject members.
            {(pendingVerif.count ?? 0) > 0 && (
              <span className="ml-1 font-bold text-foreground">
                {pendingVerif.count} waiting.
              </span>
            )}
          </p>
          <Button asChild variant="accent">
            <Link href="/admin/verifications">Open review queue</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Reports & moderation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Review reported listings and users, and resolve or dismiss them.
            {(openReports.count ?? 0) > 0 && (
              <span className="ml-1 font-bold text-foreground">
                {openReports.count} open.
              </span>
            )}
          </p>
          <Button asChild variant="accent">
            <Link href="/admin/reports">Open reports</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
