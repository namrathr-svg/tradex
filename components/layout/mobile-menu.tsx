"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { signout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

type Link = { href: string; label: string };

export function MobileMenu({
  authed,
  links,
}: {
  authed: boolean;
  links: Link[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-card"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-background/40"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed inset-x-0 top-16 z-50 space-y-1 border-b-2 border-border bg-background p-4 shadow-brutal">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-base font-bold transition-colors hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              {authed ? (
                <form action={signout}>
                  <Button variant="outline" className="w-full">Log out</Button>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
                  </Button>
                  <Button asChild variant="accent" className="w-full">
                    <Link href="/signup" onClick={() => setOpen(false)}>Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
