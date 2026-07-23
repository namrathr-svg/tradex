import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { signout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/verification/verification-badge";

export async function Navbar() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            TX
          </span>
          <span className="text-lg">TradeX</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/browse" className="hover:text-foreground">Browse</Link>
          {profile && (
            <>
              <Link href="/sell" className="hover:text-foreground">Sell</Link>
              <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <Link href="/offers" className="hover:text-foreground">Offers</Link>
              <Link href="/messages" className="hover:text-foreground">Messages</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-medium">{profile.name ?? "You"}</span>
                <VerificationBadge status={profile.verification_status} />
              </div>
              <form action={signout}>
                <Button variant="outline" size="sm">Log out</Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
