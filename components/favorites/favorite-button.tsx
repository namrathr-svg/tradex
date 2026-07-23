"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/favorites/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  listingId,
  initialActive,
  variant = "icon",
  className,
}: {
  listingId: string;
  initialActive: boolean;
  variant?: "icon" | "full";
  className?: string;
}) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActive((v) => !v); // optimistic
    const fd = new FormData();
    fd.set("listing_id", listingId);
    startTransition(() => toggleFavorite(fd));
  }

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant={active ? "pink" : "outline"}
        onClick={onClick}
        disabled={pending}
        className={className}
      >
        <Heart className={cn("h-4 w-4", active && "fill-current")} />
        {active ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-card shadow-brutal-sm transition hover:-translate-y-0.5",
        className,
      )}
    >
      <Heart
        className={cn("h-4 w-4", active ? "fill-pop-pink text-pop-pink" : "text-foreground")}
      />
    </button>
  );
}
