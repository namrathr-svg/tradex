import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { VERIFICATION_DOCS_BUCKET } from "@/lib/constants";
import { approveVerification, rejectVerification } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Profile, Verification, VerificationStatus } from "@/types/database";

export const metadata: Metadata = { title: "Review verification" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<VerificationStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export default async function VerificationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: verifData } = await supabase
    .from("verifications")
    .select("*")
    .eq("id", id)
    .single();
  const verif = verifData as Verification | null;
  if (!verif) notFound();

  const { data: profData } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", verif.user_id)
    .single();
  const member = profData as Profile | null;

  // Signed URLs for the private documents (admins can read via storage RLS).
  const [selfie, idPhoto] = await Promise.all([
    verif.selfie_url
      ? supabase.storage.from(VERIFICATION_DOCS_BUCKET).createSignedUrl(verif.selfie_url, 3600)
      : Promise.resolve({ data: null }),
    verif.id_photo_url
      ? supabase.storage.from(VERIFICATION_DOCS_BUCKET).createSignedUrl(verif.id_photo_url, 3600)
      : Promise.resolve({ data: null }),
  ]);

  return (
    <main className="container max-w-3xl py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/verifications"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-card shadow-brutal-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-extrabold">Review verification</h1>
        <Badge variant={STATUS_VARIANT[verif.status]} className="ml-auto">
          {verif.status}
        </Badge>
      </div>

      {/* Member + ID details */}
      <div className="grid gap-3 rounded-2xl border-2 border-border bg-card p-5 shadow-brutal-sm sm:grid-cols-2">
        <Detail label="Name" value={member?.name ?? "—"} />
        <Detail label="Email" value={member?.email ?? "—"} />
        <Detail label="ID type" value={verif.id_type} />
        {/* Unmasked ONLY here, on the reviewer screen */}
        <Detail label="ID number" value={verif.id_number} mono />
        <Detail label="Address" value={verif.address ?? "—"} className="sm:col-span-2" />
        <Detail label="Submitted" value={formatDate(verif.submitted_at)} />
        {verif.reviewed_at && (
          <Detail label="Reviewed" value={formatDate(verif.reviewed_at)} />
        )}
      </div>

      {/* Documents */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DocImage label="Selfie" url={selfie.data?.signedUrl} />
        <DocImage label="Government ID" url={idPhoto.data?.signedUrl} />
      </div>

      {/* Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <form action={approveVerification} className="rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm">
          <input type="hidden" name="verification_id" value={verif.id} />
          <p className="mb-3 text-sm font-bold">Approve this member</p>
          <Button type="submit" variant="lime" className="w-full">
            Approve
          </Button>
        </form>

        <form action={rejectVerification} className="rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm">
          <input type="hidden" name="verification_id" value={verif.id} />
          <p className="mb-2 flex items-center gap-1 text-sm font-bold">
            <ShieldAlert className="h-4 w-4" /> Reject with reason
          </p>
          <Textarea
            name="reason"
            placeholder="e.g. ID photo is blurry / name doesn't match"
            className="mb-3 min-h-[70px]"
            required
          />
          <Button type="submit" variant="destructive" className="w-full">
            Reject
          </Button>
        </form>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`font-semibold ${mono ? "font-mono tracking-wider" : ""}`}>{value}</p>
    </div>
  );
}

function DocImage({ label, url }: { label: string; url?: string | null }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-border bg-secondary">
        {url ? (
          <Image src={url} alt={label} fill sizes="(max-width: 640px) 100vw, 400px" className="object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
            No image
          </div>
        )}
      </div>
    </div>
  );
}
