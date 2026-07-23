"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Upload, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VERIFICATION_DOCS_BUCKET } from "@/lib/constants";
import { submitVerification, type VerifyState } from "@/app/verify/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ID_TYPES = ["Aadhaar", "PAN card", "Passport", "Driving licence", "Voter ID"];

export function VerifyForm({ userId }: { userId: string }) {
  const supabase = createClient();
  const [selfiePath, setSelfiePath] = useState("");
  const [idPhotoPath, setIdPhotoPath] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<VerifyState, FormData>(
    submitVerification,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="selfie_path" value={selfiePath} />
      <input type="hidden" name="id_photo_path" value={idPhotoPath} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="id_type">ID type</Label>
          <Select id="id_type" name="id_type" defaultValue="Aadhaar">
            {ID_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_number">ID number</Label>
          <Input id="id_number" name="id_number" placeholder="XXXX XXXX XXXX" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" placeholder="Your current address" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <UploadSlot
          label="Selfie"
          hint="A clear photo of your face"
          bucket={supabase}
          userId={userId}
          prefix="selfie"
          done={!!selfiePath}
          onDone={setSelfiePath}
          onError={setError}
        />
        <UploadSlot
          label="Government ID photo"
          hint="A photo of your ID document"
          bucket={supabase}
          userId={userId}
          prefix="id"
          done={!!idPhotoPath}
          onDone={setIdPhotoPath}
          onError={setError}
        />
      </div>

      {(error || state?.error) && (
        <p className="rounded-xl border-2 border-border bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error || state?.error}
        </p>
      )}

      <p className="text-xs font-medium text-muted-foreground">
        Your documents are stored privately and only visible to you and our
        review team. Your ID number is masked everywhere except the reviewer&apos;s
        screen.
      </p>

      <Button type="submit" size="lg" variant="accent" disabled={pending}>
        {pending ? "Submitting…" : "Submit for verification"}
      </Button>
    </form>
  );
}

function UploadSlot({
  label,
  hint,
  bucket,
  userId,
  prefix,
  done,
  onDone,
  onError,
}: {
  label: string;
  hint: string;
  bucket: ReturnType<typeof createClient>;
  userId: string;
  prefix: string;
  done: boolean;
  onDone: (path: string) => void;
  onError: (msg: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    onError(null);
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${prefix}-${crypto.randomUUID()}.${ext}`;
    const { error } = await bucket.storage
      .from(VERIFICATION_DOCS_BUCKET)
      .upload(path, file, { upsert: true });
    setBusy(false);
    if (error) {
      onError(error.message);
      return;
    }
    onDone(path);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center transition hover:bg-secondary"
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : done ? (
          <Check className="h-6 w-6 text-pop-lime" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
        <span className="text-sm font-bold">
          {done ? "Uploaded" : busy ? "Uploading…" : "Tap to upload"}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{hint}</span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}
