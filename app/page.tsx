import Link from "next/link";
import { ShieldCheck, Sparkles, Tag } from "lucide-react";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified sellers only",
    body: "Every seller passes identity verification before they can list, message or make offers.",
  },
  {
    icon: Tag,
    title: "Sneakers, streetwear & collectibles",
    body: "A focused marketplace for the pieces you actually want — no clutter, no noise.",
  },
  {
    icon: Sparkles,
    title: "Make offers, close deals",
    body: "Negotiate directly with sellers, track your offers and orders in one clean dashboard.",
  },
];

export default async function LandingPage() {
  const user = await getUser();

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--accent)/0.12),transparent)]" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
            Identity-verified marketplace
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Trade sneakers & streetwear with people you can trust.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            TradeX makes peer-to-peer trading safer through identity
            verification. Browse freely — get verified to buy and sell.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Button asChild size="lg" variant="accent">
                <Link href="/browse">Browse listings</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" variant="accent">
                  <Link href="/signup">Get started — it&apos;s free</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/browse">Browse listings</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container grid gap-6 pb-24 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
