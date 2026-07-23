import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Clock, ShieldX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { VerifyForm } from "@/components/verification/verify-form";
import { Button } from "@/components/ui/button";
import type { Verification } from "@/types/database";

export const metadata: Metadata = { title: "Get verified" };
export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/verify");

  const supabase = await createClient();
  const { data: latestData } = await supabase
    .from("verifications")
    .select("*")
    .eq("user_id", profile.user_id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latest = latestData as Verification | null;

  // Already verified
  if (profile.verification_status === "approved") {
    return (
      <Shell>
        <StatusCard
          icon={<BadgeCheck className="h-7 w-7" />}
          tone="bg-pop-lime"
          title="You're verified! 🎉"
          body="You can list items, message sellers and make offers. Go find something."
        >
          <Button asChild variant="accent">
            <Link href="/browse">Start browsing</Link>
          </Button>
        </StatusCard>
      </Shell>
    );
  }

  // Submitted, awaiting review
  if (latest && latest.status === "pending") {
    return (
      <Shell>
        <StatusCard
          icon={<Clock className="h-7 w-7" />}
          tone="bg-accent"
          title="Under review"
          body="Thanks! Your documents are in the queue. We'll update your status once a reviewer checks them."
        >
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </StatusCard>
      </Shell>
    );
  }

  // Not submitted yet, or rejected → show the form
  return (
    <Shell>
      <h1 className="font-display text-3xl font-extrabold">Get verified</h1>
      <p className="mt-1 mb-6 text-sm font-medium text-muted-foreground">
        Verify your identity to unlock selling, messaging and offers. Takes a
        minute.
      </p>

      {latest && latest.status === "rejected" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-border bg-destructive/10 p-4 shadow-brutal-sm">
          <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-bold text-destructive">Your last submission was rejected</p>
            {latest.rejection_reason && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Reason: {latest.rejection_reason}
              </p>
            )}
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Please fix the issue and resubmit below.
            </p>
          </div>
        </div>
      )}

      <VerifyForm userId={profile.user_id} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="container max-w-2xl py-12">{children}</main>;
}

function StatusCard({
  icon,
  tone,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border-2 border-border bg-card p-10 text-center shadow-brutal">
      <div
        className={`mb-4 flex h-16 w-16 rotate-2.5 items-center justify-center rounded-2xl border-2 border-border ${tone} text-foreground shadow-brutal-sm`}
      >
        {icon}
      </div>
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{body}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
