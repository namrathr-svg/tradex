import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/settings");

  return (
    <main className="container max-w-2xl py-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Edit profile</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            This is what buyers see on your public seller profile.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/sellers/${profile.user_id}`}>View profile</Link>
        </Button>
      </div>

      <ProfileForm profile={profile} />
    </main>
  );
}
