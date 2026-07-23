import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-2 border-border px-2.5 py-0.5 text-xs font-bold",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground",
        accent: "bg-accent text-accent-foreground",
        lime: "bg-pop-lime text-foreground",
        sky: "bg-pop-sky text-foreground",
        pink: "bg-pop-pink text-white",
        violet: "bg-pop-violet text-white",
        success: "bg-pop-lime text-foreground",
        warning: "bg-accent text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
