"use client";

import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { createReport, type ReportState } from "@/app/reports/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReportTargetType } from "@/types/database";

const REASONS = [
  "Scam or fraud",
  "Counterfeit / fake item",
  "Prohibited item",
  "Inappropriate content",
  "Spam",
  "Other",
];

export function ReportButton({
  targetType,
  targetId,
  label = "Report",
}: {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ReportState, FormData>(
    createReport,
    null,
  );

  if (state && "ok" in state) {
    return (
      <p className="text-xs font-bold text-muted-foreground">
        Thanks — our team will review this. ✅
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-destructive"
      >
        <Flag className="h-3.5 w-3.5" /> {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border-2 border-border bg-card p-4 shadow-brutal-sm">
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <p className="text-sm font-bold">Report this {targetType}</p>
      <Select name="reason" defaultValue={REASONS[0]}>
        {REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>
      <Textarea name="details" placeholder="Anything else we should know? (optional)" className="min-h-[60px]" />
      {state && "error" in state && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={pending}>
          {pending ? "Sending…" : "Submit report"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
