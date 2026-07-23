"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { unlockAdmin, type UnlockState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminUnlock() {
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(
    unlockAdmin,
    null,
  );

  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border-2 border-border bg-card p-8 shadow-brutal">
        <div className="mb-4 flex h-14 w-14 rotate-2.5 items-center justify-center rounded-2xl border-2 border-border bg-accent text-accent-foreground shadow-brutal-sm">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-extrabold">Admin panel locked</h1>
        <p className="mt-1 mb-6 text-sm font-medium text-muted-foreground">
          Enter the admin password to continue.
        </p>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm font-medium text-destructive">{state.error}</p>
          )}
          <Button type="submit" variant="accent" className="w-full" disabled={pending}>
            {pending ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </div>
    </main>
  );
}
