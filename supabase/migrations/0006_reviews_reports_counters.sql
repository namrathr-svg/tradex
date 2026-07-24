-- ===========================================================================
-- 0006 — ratings & reviews, reporting & moderation, counter-offers.
-- Run in the Supabase SQL Editor after the earlier migrations.
-- ===========================================================================

-- ---- Counter-offers: extend the offers model -----------------------------
alter type offer_status add value if not exists 'countered';
alter type offer_status add value if not exists 'withdrawn';

alter table public.offers
  add column if not exists last_actor_id uuid references auth.users(id) on delete set null;

-- ---- Reviews --------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (order_id, reviewer_id)
);

create index if not exists idx_reviews_reviewee on public.reviews(reviewee_id);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews for select using (true);

drop policy if exists "reviews_insert_participant" on public.reviews;
create policy "reviews_insert_participant"
  on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and reviewer_id <> reviewee_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.status = 'completed'
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
        and reviewee_id = case
          when o.buyer_id = auth.uid() then o.seller_id else o.buyer_id
        end
    )
  );

-- ---- Reports --------------------------------------------------------------
do $$ begin
  create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('listing', 'user', 'message', 'conversation')),
  target_id   uuid not null,
  reason      text not null,
  details     text,
  status      report_status not null default 'open',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_reports_status on public.reports(status);

alter table public.reports enable row level security;

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
  on public.reports for insert
  with check (reporter_id = auth.uid());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
  on public.reports for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
