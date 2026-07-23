# TradeX

A trusted marketplace for **sneakers, streetwear & collectibles**. Every seller
is identity-verified before they can list, message or make offers. Built with
**Next.js 15**, **TypeScript**, **Tailwind CSS**, **shadcn-style UI** and
**Supabase** (Postgres + Auth + Storage + Realtime).

> **Status:** Foundation phase complete — auth, profiles, database schema, RLS
> and storage are wired up. Listings, offers, orders, messaging and the
> verification gate are being added incrementally.

---

## 1. Prerequisites

- [Node.js 20+](https://nodejs.org) installed
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for deployment later)

---

## 2. Create your Supabase project

1. Go to <https://supabase.com/dashboard> and click **New project**.
2. Give it a name (e.g. `tradex`), set a strong database password (save it
   somewhere), pick the region closest to you, and click **Create new project**.
3. Wait ~2 minutes for it to finish provisioning.

### Where to find your keys

1. In your project, click the **gear icon** (Project Settings) in the left
   sidebar, then open **API Keys**.
2. On the **"Publishable and secret API keys"** tab you'll see:
   - **Publishable key** (`sb_publishable_...`) → this is your
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for the browser)
   - **Secret key** (`sb_secret_...`, click the eye icon to reveal) → this is
     your `SUPABASE_SERVICE_ROLE_KEY` — **keep this secret, never share it**
3. For the **Project URL**, open the **Data API** page (or the API settings) —
   it looks like `https://xxxx.supabase.co` → this is your
   `NEXT_PUBLIC_SUPABASE_URL`.

> **Note:** Older Supabase projects show these as `anon public` and
> `service_role` keys instead. They work exactly the same way — the newer
> `sb_publishable_` / `sb_secret_` keys map to the same two env variables.

---

## 3. Set up the database

1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Open the file [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   from this project, copy **all** of it, paste it into the SQL editor, and click
   **Run**.
3. You should see "Success. No rows returned." This created:
   - All 7 tables (`profiles`, `verifications`, `listings`, `offers`, `orders`,
     `conversations`, `messages`)
   - Row Level Security policies
   - Two storage buckets (`listing-images` public, `verification-docs` private)
   - A trigger that automatically creates a profile whenever someone signs up

---

## 4. Configure the app

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and paste in the three values from step 2, plus keep
   `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development.

---

## 5. Run it locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You can now:

- **Sign up** for an account (Landing page → "Get started")
- Get redirected to your **Dashboard**, which shows your profile and a
  "Get verified" prompt (new users start in `pending` status)
- **Log out** and **log in** again

### Make yourself an admin

After signing up once, run this in the Supabase SQL editor (replace the email):

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

Admins can access the verification review panel (added in a later phase).

---

## 6. Enable Google login (optional, later)

1. Supabase dashboard → **Authentication** → **Providers** → **Google** → enable.
2. Follow Supabase's instructions to create Google OAuth credentials and paste
   the Client ID / Secret.
3. Add `http://localhost:3000/auth/callback` and your production callback URL to
   the allowed redirect URLs.

---

## Project structure

```
tradex/
├── app/
│   ├── (auth)/              # login, signup pages + auth server actions
│   ├── auth/callback/       # OAuth / email confirmation handler
│   ├── dashboard/           # seller dashboard
│   ├── layout.tsx           # root layout + navbar
│   ├── page.tsx             # landing page
│   └── globals.css          # theme tokens (black/white/gray/blue)
├── components/
│   ├── ui/                  # reusable primitives (button, input, card…)
│   ├── auth/                # auth form
│   ├── layout/              # navbar
│   └── verification/        # verification badge
├── lib/
│   ├── supabase/            # browser / server / admin / middleware clients
│   ├── auth.ts              # getUser / getProfile helpers
│   └── utils.ts             # cn(), formatINR(), maskIdNumber()…
├── types/database.ts        # TypeScript types mirroring the SQL schema
├── supabase/migrations/     # the SQL you run in Supabase
└── middleware.ts            # refreshes the auth session on every request
```

---

## Deploying to Vercel (later)

1. Push this repo to GitHub (already done if you're reading this there).
2. Go to <https://vercel.com/new>, import the repo.
3. Add the same environment variables from `.env.local` in the Vercel project
   settings (set `NEXT_PUBLIC_SITE_URL` to your Vercel domain).
4. Deploy. Then in Supabase → Authentication → URL Configuration, add your Vercel
   domain + `/auth/callback` to the redirect allow-list.
