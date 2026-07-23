import Link from "next/link";
import { ShieldCheck, Sparkles, Tag, Zap, ArrowRight } from "lucide-react";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified sellers only",
    body: "Everyone passes ID verification before they can list, message or make offers. No sketchy DMs.",
    tone: "bg-pop-lime",
  },
  {
    icon: Tag,
    title: "Kicks, fits & rare finds",
    body: "Sneakers, streetwear and collectibles — a marketplace built for the culture, not the clutter.",
    tone: "bg-pop-sky",
  },
  {
    icon: Zap,
    title: "Make offers, close deals",
    body: "Slide an offer, chat in real time, track everything in one clean dashboard. Easy.",
    tone: "bg-pop-pink",
  },
];

const MARQUEE = [
  "SNEAKERS", "STREETWEAR", "COLLECTIBLES", "VERIFIED", "NO SCAMS",
  "REAL DEALS", "SNEAKERS", "STREETWEAR", "COLLECTIBLES", "VERIFIED",
];

export default async function LandingPage() {
  const user = await getUser();

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-border">
        <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rotate-12 rounded-3xl border-2 border-border bg-accent opacity-70" />
        <div className="pointer-events-none absolute -left-8 bottom-8 h-24 w-24 -rotate-6 rounded-full border-2 border-border bg-pop-pink opacity-70" />

        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <span className="mb-6 inline-flex -rotate-1.5 items-center gap-2 rounded-full border-2 border-border bg-card px-4 py-1.5 text-xs font-bold shadow-brutal-sm">
            <Sparkles className="h-3.5 w-3.5" />
            India&apos;s verified marketplace for the culture
          </span>

          <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[0.95] sm:text-6xl md:text-7xl">
            Cop &amp; sell{" "}
            <span className="relative inline-block">
              <span className="relative z-10">the good stuff</span>
              <span className="absolute inset-x-0 bottom-1 -z-0 h-4 -rotate-1 bg-accent" />
            </span>{" "}
            — safely.
          </h1>

          <p className="mt-6 max-w-xl text-lg font-medium text-muted-foreground">
            TradeX makes peer-to-peer trading actually safe with real ID
            verification. Browse for free — get verified to buy &amp; sell. 🔥
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Button asChild size="lg" variant="accent">
                <Link href="/browse">
                  Start browsing <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" variant="accent">
                  <Link href="/signup">
                    Get started — it&apos;s free <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/browse">Browse listings</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-b-2 border-border bg-accent py-3">
        <div className="flex animate-[marquee_22s_linear_infinite] gap-6 whitespace-nowrap font-display text-lg font-extrabold text-accent-foreground">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i} className="flex items-center gap-6">
              {w} <span className="text-xl">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="container grid gap-6 py-24 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body, tone }, i) => (
          <div
            key={title}
            className={`rounded-2xl border-2 border-border bg-card p-6 shadow-brutal ${
              i === 1 ? "md:translate-y-4" : ""
            }`}
          >
            <div
              className={`mb-4 flex h-12 w-12 rotate-2.5 items-center justify-center rounded-xl border-2 border-border ${tone} shadow-brutal-sm`}
            >
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold">{title}</h3>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      {/* CTA band */}
      <section className="border-t-2 border-border bg-primary">
        <div className="container flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl font-display text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            Ready to trade with people you can actually trust?
          </h2>
          <Button asChild size="lg" variant="accent">
            <Link href={user ? "/browse" : "/signup"}>
              {user ? "Browse the drop" : "Join TradeX"} <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
