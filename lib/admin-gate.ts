import { cookies } from "next/headers";
import { createHash } from "crypto";

const COOKIE = "tradex_admin_unlock";

/** A non-reversible token derived from the password (so we never store it raw). */
function token(pw: string) {
  return createHash("sha256").update(`tradex:${pw}`).digest("hex");
}

/** Is an admin-panel password configured at all? */
export function adminPasswordSet() {
  return !!process.env.ADMIN_PANEL_PASSWORD;
}

/** True if the current browser has already entered the correct password. */
export async function isAdminUnlocked() {
  const pw = process.env.ADMIN_PANEL_PASSWORD;
  if (!pw) return true; // no password configured -> gate disabled
  const store = await cookies();
  return store.get(COOKIE)?.value === token(pw);
}

/** Records that this browser passed the password check. Call from a server action. */
export async function setAdminUnlockCookie() {
  const pw = process.env.ADMIN_PANEL_PASSWORD;
  if (!pw) return;
  const store = await cookies();
  store.set(COOKIE, token(pw), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

/** Clears the unlock (lock the panel again). */
export async function clearAdminUnlockCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
