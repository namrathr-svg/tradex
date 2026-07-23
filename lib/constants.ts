import type { ListingCategory, ListingCondition } from "@/types/database";

export const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: "sneakers", label: "Sneakers" },
  { value: "streetwear", label: "Streetwear" },
  { value: "collectibles", label: "Collectibles" },
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
];

export const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: "new", label: "Brand new" },
  { value: "like_new", label: "Like new" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export const CATEGORY_LABEL: Record<ListingCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<ListingCategory, string>;

export const CONDITION_LABEL: Record<ListingCondition, string> = Object.fromEntries(
  CONDITIONS.map((c) => [c.value, c.label]),
) as Record<ListingCondition, string>;

/** Max images allowed per listing. */
export const MAX_LISTING_IMAGES = 6;

/** The storage bucket for public listing photos. */
export const LISTING_IMAGES_BUCKET = "listing-images";

/** The storage bucket for private verification documents. */
export const VERIFICATION_DOCS_BUCKET = "verification-docs";
