import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating display. */
export function StarRating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i <= rounded ? "fill-accent text-accent" : "fill-muted text-muted",
            )}
          />
        ))}
      </span>
      <span className="text-sm font-bold">{value ? value.toFixed(1) : "—"}</span>
      {typeof count === "number" && (
        <span className="text-sm font-medium text-muted-foreground">({count})</span>
      )}
    </span>
  );
}
