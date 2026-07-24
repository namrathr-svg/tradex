import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { signout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileMenu } from "@/components/layout/mobile-menu";

export async function Navbar() {
  const profile = await getProfile();

  const mobileLinks = profile
    ? [
        { href: "/browse", label: "Browse" },
        { href: "/sell", label: "Sell" },
        { href: "/favorites", label: "Favorites" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/offers", label: "Offers" },
        { href: "/messages", label: "Messages" },
        { href: "/settings", label: "Edit profile" },
        ...(profile.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [{ href: "/browse", label: "Browse" }];

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 -rotate-2.5 items-center justify-center rounded-xl border-2 border-border bg-accent font-display text-sm font-extrabold text-accent-foreground shadow-brutal-sm">
            TX
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">TradeX</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-bold lg:flex">
          <NavLink href="/browse">Browse</NavLink>
          {profile && (
            <>
              <NavLink href="/sell">Sell</NavLink>
              <NavLink href="/favorites">Favorites</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/offers">Offers</NavLink>
              <NavLink href="/messages">Messages</NavLink>
              {profile.is_admin && <NavLink href="/admin">Admin</NavLink>}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Desktop auth / avatar */}
          <div className="hidden items-center gap-2 md:flex">
            {profile ? (
              <>
                <Link href="/settings" className="flex items-center gap-2">
                  <span className="hidden text-sm font-bold lg:inline">
                    {profile.name ?? "You"}
                  </span>
                  <VerificationBadge status={profile.verification_status} />
                  <Avatar url={profile.avatar_url} name={profile.name} className="h-9 w-9 text-sm" />
                </Link>
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

          <MobileMenu authed={!!profile} links={mobileLinks} />
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
