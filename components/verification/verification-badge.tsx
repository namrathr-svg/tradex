import { BadgeCheck, Clock, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types/database";

const MAP: Record<
  VerificationStatus,
  { label: string; icon: typeof BadgeCheck; className: string }
> = {
  approved: {
    label: "Verified",
    icon: BadgeCheck,
    className: "bg-accent text-accent-foreground",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-muted text-muted-foreground",
  },
  rejected: {
    label: "Rejected",
    icon: ShieldX,
    className: "bg-destructive/10 text-destructive",
  },
};

export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const { label, icon: Icon, className: tone } = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
