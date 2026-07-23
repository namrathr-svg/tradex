import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { signout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/verification/verification-badge";

export async function Navbar() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 -rotate-2.5 items-center justify-center rounded-xl border-2 border-border bg-accent font-display text-sm font-extrabold text-accent-foreground shadow-brutal-sm">
            TX
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            TradeX
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-bold md:flex">
          <NavLink href="/browse">Browse</NavLink>
          {profile && (
            <>
              <NavLink href="/sell">Sell</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/offers">Offers</NavLink>
              <NavLink href="/messages">Messages</NavLink>
              {profile.is_admin && <NavLink href="/admin">Admin</NavLink>}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-bold">{profile.name ?? "You"}</span>
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
              <Button asChild variant="accent" size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  );
}
