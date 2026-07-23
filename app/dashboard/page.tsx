import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <main className="container py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {profile.name ?? "trader"}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {profile.email}
            <VerificationBadge status={profile.verification_status} />
          </p>
        </div>
      </div>

      {profile.verification_status !== "approved" && (
        <Card className="mb-8 border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base">Get verified to unlock selling</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Upload a selfie, a government ID and your address to start listing,
              messaging and making offers.
            </p>
            <Button asChild>
              <Link href="/verify">Start verification</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Your seller analytics will appear here once listings are wired up.
      </p>
    </main>
  );
}
