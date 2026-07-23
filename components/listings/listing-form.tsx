"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createListing, type CreateListingState } from "@/app/sell/actions";
import { updateListing, type ListingFormState } from "@/app/listings/actions";
import {
  CATEGORIES,
  CONDITIONS,
  LISTING_IMAGES_BUCKET,
  MAX_LISTING_IMAGES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Listing } from "@/types/database";

/**
 * Shared form for creating a new listing or editing an existing one.
 * Pass `listing` to switch into edit mode.
 */
export function ListingForm({
  userId,
  listing,
}: {
  userId: string;
  listing?: Listing;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(listing?.image_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const action = listing ? updateListing : createListing;
  const [state, formAction, pending] = useActionState<
    CreateListingState | ListingFormState,
    FormData
  >(action, null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const remaining = MAX_LISTING_IMAGES - imageUrls.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      setUploadError(`You can upload up to ${MAX_LISTING_IMAGES} images.`);
      return;
    }

    setUploading(true);
    try {
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(LISTING_IMAGES_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (error) {
          setUploadError(
            /row-level|permission|denied/i.test(error.message)
              ? "Only verified sellers can upload images. Get verified first."
              : error.message,
          );
          break;
        }
        const { data } = supabase.storage
          .from(LISTING_IMAGES_BUCKET)
          .getPublicUrl(path);
        setImageUrls((prev) => [...prev, data.publicUrl]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <form action={formAction} className="space-y-6">
      {listing && <input type="hidden" name="listing_id" value={listing.id} />}

      {/* Images */}
      <div className="space-y-2">
        <Label>Photos</Label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {imageUrls.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border-2 border-border bg-secondary"
            >
              <Image src={url} alt="" fill className="object-cover" sizes="150px" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 rounded-full border-2 border-border bg-background p-1 text-foreground opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <input type="hidden" name="image_urls" value={url} />
            </div>
          ))}

          {imageUrls.length < MAX_LISTING_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-secondary/40 text-muted-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              <span className="text-xs font-bold">Add</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploadError && <p className="text-sm font-medium text-destructive">{uploadError}</p>}
        <p className="text-xs font-medium text-muted-foreground">
          Up to {MAX_LISTING_IMAGES} images. The first one is your cover photo.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Jordan 4 Retro Bred" defaultValue={listing?.title} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" defaultValue={listing?.category ?? "sneakers"}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Select id="condition" name="condition" defaultValue={listing?.condition ?? "good"}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" placeholder="Nike" defaultValue={listing?.brand ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input id="size" name="size" placeholder="UK 9" defaultValue={listing?.size ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" name="price" type="number" min="0" step="1" placeholder="12500" defaultValue={listing?.price} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Condition details, box, receipts, reason for selling…"
          defaultValue={listing?.description ?? ""}
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border-2 border-border bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" variant="accent" disabled={pending || uploading}>
        {pending ? "Saving…" : listing ? "Save changes" : "Publish listing"}
      </Button>
    </form>
  );
}
