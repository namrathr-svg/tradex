-- ===========================================================================
-- TradeX — full database schema, Row Level Security, storage, realtime.
-- Run this ONCE in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: it uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type verification_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('active', 'sold', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_condition as enum ('new', 'like_new', 'excellent', 'good', 'fair');
exception when duplicate_object then null; end $$;

do $$ begin
  create type offer_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'shipped', 'completed', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_category as enum
    ('sneakers', 'streetwear', 'collectibles', 'apparel', 'accessories', 'other');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles: one row per auth user (created automatically via trigger below)
create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  name                text,
  email               text,
  phone               text,
  avatar_url          text,
  verification_status verification_status not null default 'pending',
  is_admin            boolean not null default false,
  created_at          timestamptz not null default now()
);

-- verifications: KYC submissions reviewed by admins
create table if not exists public.verifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  id_type          text not null,
  id_number        text not null,
  selfie_url       text,
  id_photo_url     text,
  address          text,
  status           verification_status not null default 'pending',
  rejection_reason text,
  submitted_at     timestamptz not null default now(),
  reviewed_at      timestamptz
);

-- listings: items for sale
create table if not exists public.listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  category    listing_category not null default 'sneakers',
  brand       text,
  size        text,
  condition   listing_condition not null default 'good',
  price       numeric(12,2) not null check (price >= 0),
  description text,
  image_urls  text[] not null default '{}',
  status      listing_status not null default 'active',
  view_count  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- offers: buyer proposes a price on a listing
create table if not exists public.offers (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  buyer_id     uuid not null references auth.users(id) on delete cascade,
  seller_id    uuid not null references auth.users(id) on delete cascade,
  offer_amount numeric(12,2) not null check (offer_amount >= 0),
  status       offer_status not null default 'pending',
  created_at   timestamptz not null default now()
);

-- orders: a confirmed transaction
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id   uuid not null references auth.users(id) on delete cascade,
  seller_id  uuid not null references auth.users(id) on delete cascade,
  amount     numeric(12,2) not null check (amount >= 0),
  status     order_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- conversations: a buyer<->seller thread about a listing
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references public.listings(id) on delete cascade,
  buyer_id        uuid not null references auth.users(id) on delete cascade,
  seller_id       uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  unique (listing_id, buyer_id, seller_id)
);

-- messages: individual chat messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references auth.users(id) on delete cascade,
  receiver_id     uuid not null references auth.users(id) on delete cascade,
  content         text not null check (char_length(content) between 1 and 4000),
  created_at      timestamptz not null default now()
);

-- Useful indexes
create index if not exists idx_listings_status      on public.listings(status);
create index if not exists idx_listings_category    on public.listings(category);
create index if not exists idx_listings_seller      on public.listings(seller_id);
create index if not exists idx_listings_created     on public.listings(created_at desc);
create index if not exists idx_offers_seller        on public.offers(seller_id);
create index if not exists idx_offers_buyer         on public.offers(buyer_id);
create index if not exists idx_offers_listing       on public.offers(listing_id);
create index if not exists idx_orders_seller        on public.orders(seller_id);
create index if not exists idx_orders_buyer         on public.orders(buyer_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);
create index if not exists idx_conversations_buyer  on public.conversations(buyer_id);
create index if not exists idx_conversations_seller on public.conversations(seller_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where user_id = uid), false);
$$;

create or replace function public.is_approved(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select verification_status = 'approved' from public.profiles where user_id = uid),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Trigger: auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: keep profile.verification_status in sync with verifications
-- ---------------------------------------------------------------------------
create or replace function public.sync_profile_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set verification_status = new.status
   where user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_verification_reviewed on public.verifications;
create trigger on_verification_reviewed
  after insert or update of status on public.verifications
  for each row execute function public.sync_profile_verification();

-- ---------------------------------------------------------------------------
-- Trigger: prevent non-admins from escalating privileges on their profile
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only guard real logged-in users. When auth.uid() is null the update is
  -- coming from the SQL editor / service_role / an admin action — allow it.
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    new.is_admin := old.is_admin;
    new.verification_status := old.verification_status;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_update_guard on public.profiles;
create trigger on_profile_update_guard
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles       enable row level security;
alter table public.verifications  enable row level security;
alter table public.listings       enable row level security;
alter table public.offers         enable row level security;
alter table public.orders         enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;

-- ---- profiles -------------------------------------------------------------
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true); -- seller cards are public; sensitive KYC lives in verifications

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- verifications --------------------------------------------------------
drop policy if exists "verifications_select_own_or_admin" on public.verifications;
create policy "verifications_select_own_or_admin"
  on public.verifications for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "verifications_insert_own" on public.verifications;
create policy "verifications_insert_own"
  on public.verifications for insert
  with check (user_id = auth.uid());

drop policy if exists "verifications_update_admin" on public.verifications;
create policy "verifications_update_admin"
  on public.verifications for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---- listings -------------------------------------------------------------
drop policy if exists "listings_select_visible" on public.listings;
create policy "listings_select_visible"
  on public.listings for select
  using (
    status = 'active'
    or seller_id = auth.uid()
    or public.is_admin(auth.uid())
  );

drop policy if exists "listings_insert_approved" on public.listings;
create policy "listings_insert_approved"
  on public.listings for insert
  with check (seller_id = auth.uid() and public.is_approved(auth.uid()));

drop policy if exists "listings_update_own_or_admin" on public.listings;
create policy "listings_update_own_or_admin"
  on public.listings for update
  using (seller_id = auth.uid() or public.is_admin(auth.uid()))
  with check (seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "listings_delete_own_or_admin" on public.listings;
create policy "listings_delete_own_or_admin"
  on public.listings for delete
  using (seller_id = auth.uid() or public.is_admin(auth.uid()));

-- ---- offers ---------------------------------------------------------------
drop policy if exists "offers_select_participant" on public.offers;
create policy "offers_select_participant"
  on public.offers for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "offers_insert_buyer_approved" on public.offers;
create policy "offers_insert_buyer_approved"
  on public.offers for insert
  with check (
    buyer_id = auth.uid()
    and buyer_id <> seller_id
    and public.is_approved(auth.uid())
  );

drop policy if exists "offers_update_participant" on public.offers;
create policy "offers_update_participant"
  on public.offers for update
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin(auth.uid()))
  with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin(auth.uid()));

-- ---- orders ---------------------------------------------------------------
drop policy if exists "orders_select_participant" on public.orders;
create policy "orders_select_participant"
  on public.orders for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "orders_insert_participant" on public.orders;
create policy "orders_insert_participant"
  on public.orders for insert
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "orders_update_participant" on public.orders;
create policy "orders_update_participant"
  on public.orders for update
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin(auth.uid()))
  with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin(auth.uid()));

-- ---- conversations --------------------------------------------------------
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "conversations_insert_participant_approved" on public.conversations;
create policy "conversations_insert_participant_approved"
  on public.conversations for insert
  with check (
    (buyer_id = auth.uid() or seller_id = auth.uid())
    and public.is_approved(auth.uid())
  );

drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant"
  on public.conversations for update
  using (buyer_id = auth.uid() or seller_id = auth.uid())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- ---- messages -------------------------------------------------------------
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "messages_insert_sender_approved" on public.messages;
create policy "messages_insert_sender_approved"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.is_approved(auth.uid()));

-- ===========================================================================
-- Realtime — broadcast changes on messages & conversations
-- ===========================================================================
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- Storage buckets + policies
-- ===========================================================================

-- listing-images: PUBLIC read, approved sellers can upload
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- verification-docs: PRIVATE, owner + admin only
insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

-- listing-images policies
drop policy if exists "listing_images_public_read" on storage.objects;
create policy "listing_images_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

drop policy if exists "listing_images_insert_approved" on storage.objects;
create policy "listing_images_insert_approved"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and public.is_approved(auth.uid())
  );

drop policy if exists "listing_images_update_owner" on storage.objects;
create policy "listing_images_update_owner"
  on storage.objects for update
  using (bucket_id = 'listing-images' and owner = auth.uid());

drop policy if exists "listing_images_delete_owner" on storage.objects;
create policy "listing_images_delete_owner"
  on storage.objects for delete
  using (bucket_id = 'listing-images' and owner = auth.uid());

-- verification-docs policies.
-- Files MUST be stored under a folder named after the user's id, e.g.
--   verification-docs/<user_id>/selfie.jpg
-- so the first path segment identifies the owner.
drop policy if exists "verification_docs_read_owner_or_admin" on storage.objects;
create policy "verification_docs_read_owner_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'verification-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
    )
  );

drop policy if exists "verification_docs_insert_owner" on storage.objects;
create policy "verification_docs_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'verification-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verification_docs_delete_owner" on storage.objects;
create policy "verification_docs_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- Done. Next: create your admin user, then run:
--   update public.profiles set is_admin = true where email = 'you@example.com';
-- ===========================================================================
