import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown in place of a gated feature (Sell, Messages, Offers) when the current
 * user is not verified. Browsing stays open to everyone — this only guards
 * actions that require an approved identity.
 */
export function VerifyGate({
  feature,
  status,
}: {
  feature: string;
  status: "pending" | "rejected";
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border-2 border-border bg-card p-10 text-center shadow-brutal">
      <div className="mb-4 flex h-14 w-14 rotate-2.5 items-center justify-center rounded-2xl border-2 border-border bg-accent text-accent-foreground shadow-brutal-sm">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="font-display text-2xl font-extrabold">Get verified to unlock {feature}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {status === "rejected"
          ? "Your last verification was rejected. Please resubmit your details to continue."
          : "For everyone's safety, only identity-verified members can " +
            feature.toLowerCase() +
            ". It only takes a minute — upload a selfie, a government ID and your address."}
      </p>
      <Button asChild className="mt-6" variant="accent">
        <Link href="/verify">
          {status === "rejected" ? "Resubmit verification" : "Start verification"}
        </Link>
      </Button>
    </div>
  );
}
