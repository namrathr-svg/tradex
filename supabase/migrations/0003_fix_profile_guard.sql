-- ===========================================================================
-- 0003 — fix the profile-update guard.
-- The original guard reverted verification_status/is_admin whenever
-- auth.uid() was not an admin. But in the SQL editor / service_role context
-- auth.uid() is NULL, so manual approvals were being silently reverted.
-- This version only guards real logged-in non-admin users.
-- Run this in the Supabase SQL Editor.
-- ===========================================================================

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    new.is_admin := old.is_admin;
    new.verification_status := old.verification_status;
  end if;
  return new;
end;
$$;
