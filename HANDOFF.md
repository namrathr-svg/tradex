# TradeX — Project Handoff

A trusted, identity-verified marketplace for **sneakers, streetwear & collectibles**.
Built with **Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (Postgres,
Auth, Storage, Realtime, RLS)** and deployed on **Vercel**.

This document is the full reference: structure, schema, security, deployment,
seed data, testing and roadmap.

---

## 1. Complete folder structure

```
tradex/
├── app/
│   ├── (auth)/
│   │   ├── actions.ts              # login / signup / signout server actions
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── auth/callback/route.ts      # OAuth / email confirmation handler
│   ├── admin/
│   │   ├── layout.tsx              # requireAdmin() + password gate
│   │   ├── actions.ts              # approve/reject verification, unlock/lock
│   │   ├── page.tsx                # admin dashboard (stats)
│   │   └── verifications/
│   │       ├── page.tsx            # review queue (pending/approved/rejected)
│   │       └── [id]/page.tsx       # detail: docs + UNMASKED id, approve/reject
│   ├── browse/page.tsx             # listings grid + search + filters
│   ├── dashboard/page.tsx          # seller totals + listing management
│   ├── favorites/{page,actions}.ts # wishlist
│   ├── listings/
│   │   ├── actions.ts              # update / remove / relist
│   │   └── [id]/
│   │       ├── page.tsx            # listing detail
│   │       └── edit/page.tsx       # edit listing (owner)
│   ├── messages/                   # conversations list + realtime thread
│   ├── offers/{page,actions}.ts    # received/sent, accept/decline
│   ├── orders/{page,actions}.ts    # order tracking + status
│   ├── sell/{page,actions}.ts      # create listing (verified only)
│   ├── sellers/[id]/page.tsx       # public seller profile
│   ├── settings/{page,actions}.ts  # edit profile + avatar
│   ├── verify/{page,actions}.ts    # KYC submission flow
│   ├── layout.tsx                  # root layout, navbar, theme init
│   ├── page.tsx                    # landing
│   └── globals.css                 # theme tokens + brutalist utilities
├── components/
│   ├── admin/         · auth/      · dashboard/  · favorites/
│   ├── layout/ (navbar, mobile-menu, theme-toggle)
│   ├── listings/ · messages/ · offers/ · profile/ · verification/
│   └── ui/ (button, card, input, select, textarea, badge, label, avatar)
├── lib/
│   ├── supabase/ (client, server, admin, middleware)
│   ├── auth.ts        # getUser / getProfile / requireAdmin
│   ├── admin-gate.ts  # admin-panel password lock
│   ├── constants.ts   # categories, conditions, bucket names
│   └── utils.ts       # cn, formatINR, formatDate, maskIdNumber
├── types/database.ts  # typed schema (mirrors SQL)
├── middleware.ts      # refreshes the Supabase session each request
└── supabase/
    ├── migrations/ 0001…0005 .sql
    └── seed.sql
```

**Architecture notes**
- **Server Components** fetch data directly via the server Supabase client.
- **Server Actions** (`actions.ts`) handle all mutations — no custom REST layer.
- **Client Components** are used only where interactivity is needed (forms with
  uploads, realtime chat, filters, theme toggle, mobile menu).
- Image uploads go **browser → Supabase Storage** directly (avoids server-action
  body limits and scales better); only the resulting URLs/paths hit the server.

---

## 2. Database schema

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | one per auth user (auto-created) | user_id, name, email, phone, avatar_url, bio, location, verification_status, is_admin |
| `verifications` | KYC submissions | user_id, id_type, id_number, selfie_url, id_photo_url, address, status, rejection_reason |
| `listings` | items for sale | seller_id, title, category, brand, size, condition, price, image_urls[], status, view_count |
| `offers` | buyer bids | listing_id, buyer_id, seller_id, offer_amount, status |
| `orders` | confirmed sales | listing_id, buyer_id, seller_id, amount, status |
| `conversations` | buyer↔seller threads | listing_id, buyer_id, seller_id, last_message_at |
| `messages` | chat messages | conversation_id, sender_id, receiver_id, content |
| `favorites` | wishlist | user_id, listing_id (unique together) |

**Enums:** `verification_status` (pending/approved/rejected) · `listing_status`
(active/sold/removed) · `listing_condition` (new/like_new/excellent/good/fair) ·
`offer_status` (pending/accepted/declined) · `order_status`
(pending/paid/shipped/completed/disputed) · `listing_category` (sneakers/
streetwear/collectibles/apparel/accessories/other).

**Triggers**
- `handle_new_user` → creates a `profiles` row on signup.
- `sync_profile_verification` → mirrors a verification's status onto the profile.
- `guard_profile_update` → stops logged-in non-admins from changing their own
  `verification_status` / `is_admin` (allows SQL editor / service_role).

**Storage buckets:** `listing-images` (public) · `verification-docs` (private,
owner+admin only) · `avatars` (public).

---

## 3. Supabase SQL

Run the migrations **in order** in the Supabase SQL Editor:

| File | What it does |
|---|---|
| `0001_init.sql` | all tables, enums, indexes, triggers, RLS, storage buckets, realtime |
| `0002_listing_views.sql` | `increment_listing_views()` RPC |
| `0003_fix_profile_guard.sql` | fixes the guard so manual approvals stick |
| `0004_favorites.sql` | favorites table + RLS |
| `0005_profile_edit.sql` | bio/location columns + avatars bucket |

(`0001` already contains the fixed guard, so a fresh setup only strictly needs
0001, 0002, 0004, 0005.)

---

## 4. RLS policies (summary)

Every table has Row Level Security **enabled**. Highlights:

- **profiles** — public read (seller cards); update only your own row (protected
  columns guarded by trigger).
- **verifications** — read your own or admin; insert your own; **update = admin only**.
- **listings** — read if `active` OR you own it OR admin; **insert requires
  `is_approved`** (verification gate at the DB level); update/delete own or admin.
- **offers / conversations / messages** — only participants (buyer/seller/
  sender/receiver) can read; **insert requires `is_approved`**; self-dealing blocked.
- **orders** — participants only.
- **favorites** — fully private to the owner.
- **storage** — `listing-images` public read, approved users write; `verification-docs`
  readable only by owner/admin, written under `{user_id}/…`; `avatars` public
  read, written under `{user_id}/…`.

Helper functions `is_admin(uid)` and `is_approved(uid)` are `SECURITY DEFINER`
to avoid RLS recursion.

---

## 5. API routes / server actions

There is no bespoke REST API — mutations are **Server Actions**, data reads are
in **Server Components**. Route handlers exist only where needed:

- `GET /auth/callback` — exchanges the OAuth/confirmation code for a session.

Server actions by area: auth (`login/signup/signout`), sell (`createListing`),
listings (`updateListing/removeListing/relistListing`), offers
(`createOffer/acceptOffer/declineOffer`), orders (`updateOrderStatus`), messages
(`startConversation/sendMessage`), verify (`submitVerification`), admin
(`approveVerification/rejectVerification/unlockAdmin/lockAdmin`), favorites
(`toggleFavorite`), settings (`updateProfile`).

---

## 6. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | server-only privileged key (admin ops) |
| `NEXT_PUBLIC_SITE_URL` | public | site origin for auth redirects |
| `ADMIN_PANEL_PASSWORD` | secret | optional extra lock on `/admin` (unset = disabled) |

See `.env.example`. Never commit `.env.local`.

---

## 7. Deployment guide (Vercel)

1. Push to GitHub (done).
2. **vercel.com/new** → import the repo → framework auto-detects **Next.js**.
3. Add all env vars above under **Settings → Environment Variables**; set
   `NEXT_PUBLIC_SITE_URL` to your Vercel domain.
4. **Deploy.**
5. In Supabase → **Authentication → URL Configuration**, set **Site URL** to your
   Vercel domain and add `https://<domain>/**` to redirect URLs.
6. (Prod) Re-enable **Confirm email** in Authentication → Providers → Email, and
   configure a custom SMTP sender to avoid free-tier email limits.

---

## 8. Seed data

`supabase/seed.sql` inserts 5 demo listings. Edit the seller email inside it
(must be an existing, approved profile), then run it in the SQL Editor.

---

## 9. Testing checklist

- [ ] Sign up → profile row auto-created, status `pending`
- [ ] Log in / log out
- [ ] Pending user cannot Sell/Offer/Message (sees "Get verified")
- [ ] Submit verification at `/verify` → status "under review"
- [ ] Admin sees submission, docs load, ID unmasked → **Approve** → user Verified
- [ ] Reject with reason → user sees reason + can resubmit
- [ ] Create a listing (images upload, appears on Browse + Dashboard)
- [ ] Browse search + category/price/condition filters work
- [ ] Edit listing; Remove (soft-delete) hides it; Relist restores it
- [ ] Second account: Make offer → seller Accept → order created, listing sold
- [ ] Real-time chat delivers messages live between two accounts
- [ ] Favorite a listing → shows on `/favorites`
- [ ] Edit profile (avatar/bio) → reflected on public seller profile
- [ ] Dashboard totals (revenue/active/sales/pending offers) correct
- [ ] `/admin` blocked for non-admins; password prompt when `ADMIN_PANEL_PASSWORD` set
- [ ] Mobile: hamburger menu reaches every page; dark-mode toggle persists

---

## 10. Future roadmap

- **Notifications** — in-app + email for new offers/messages/approvals.
- **Ratings & reviews** after completed orders; profile score.
- **Payments/escrow** integration (currently peer-to-peer, verification-based trust).
- **Counter-offers**, offer expiry, and order dispute handling.
- **Chat upgrades** — images/documents, typing indicators, read receipts, online status.
- **Trust & safety** — reporting, duplicate-listing detection, fraud flags.
- **Discovery** — saved searches, recommendations, trending, collections.
- **Performance/SEO** — pagination/infinite scroll, dynamic OG images, sitemap.
- **Admin** — user management, listing moderation queue, revenue analytics.
```
