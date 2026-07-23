"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/**
 * Filter controls for the Browse page. Reads/writes the URL search params so
 * filters are shareable and the server component re-queries on change.
 */
export function BrowseFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/browse?${next.toString()}`);
    },
    [params, router],
  );

  const hasFilters = ["category", "condition", "min", "max"].some((k) =>
    params.get(k),
  );

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => router.push("/browse")}
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="f-category">Category</Label>
        <Select
          id="f-category"
          value={params.get("category") ?? ""}
          onChange={(e) => update("category", e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="f-condition">Condition</Label>
        <Select
          id="f-condition"
          value={params.get("condition") ?? ""}
          onChange={(e) => update("condition", e.target.value)}
        >
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price range (₹)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Min"
            defaultValue={params.get("min") ?? ""}
            onBlur={(e) => update("min", e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min="0"
            placeholder="Max"
            defaultValue={params.get("max") ?? ""}
            onBlur={(e) => update("max", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
