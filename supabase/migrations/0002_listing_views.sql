-- ===========================================================================
-- 0002 — safe view counter for listings.
-- RLS prevents a random visitor from UPDATE-ing someone else's listing, so we
-- expose a SECURITY DEFINER function that only bumps the view_count column.
-- Run this in the Supabase SQL Editor after 0001 (optional but recommended).
-- ===========================================================================

create or replace function public.increment_listing_views(listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
     set view_count = view_count + 1
   where id = listing_id and status = 'active';
$$;

grant execute on function public.increment_listing_views(uuid) to anon, authenticated;
