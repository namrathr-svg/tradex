"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AVATARS_BUCKET } from "@/lib/constants";
import { updateProfile, type ProfileState } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);

  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  );

  async function handleAvatar(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.user_id}/avatar-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-secondary font-display text-2xl font-extrabold shadow-brutal-sm"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            (profile.name ?? "U").charAt(0).toUpperCase()
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition hover:opacity-100">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </span>
        </button>
        <div>
          <p className="font-bold">Profile photo</p>
          <p className="text-sm font-medium text-muted-foreground">
            Tap the square to upload a new avatar.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatar(e.target.files?.[0])}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={profile.name ?? ""} placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="+91…" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" defaultValue={profile.location ?? ""} placeholder="Mumbai, India" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} placeholder="Tell buyers a bit about you…" />
      </div>

      {state && "error" in state && (
        <p className="rounded-xl border-2 border-border bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      {state && "ok" in state && (
        <p className="rounded-xl border-2 border-border bg-pop-lime/20 px-3 py-2 text-sm font-bold">
          Saved! ✅
        </p>
      )}

      <Button type="submit" size="lg" variant="accent" disabled={pending || uploading}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
