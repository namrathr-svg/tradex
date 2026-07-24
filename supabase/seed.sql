-- ===========================================================================
-- TradeX — optional demo seed data.
-- Creates a few sample ACTIVE listings so Browse isn't empty.
--
-- Listings need a real seller (auth user). Steps:
--   1. Sign up a user in the app (or Supabase -> Authentication -> Add user).
--   2. Approve them:  update public.profiles set verification_status='approved'
--                     where email='seller@example.com';
--   3. Replace the email below and run this file in the SQL Editor.
-- ===========================================================================

do $$
declare
  seller uuid;
begin
  select user_id into seller from public.profiles
   where email = 'seller@example.com'  -- <<< change this
   limit 1;

  if seller is null then
    raise notice 'No profile found for that email — seed skipped.';
    return;
  end if;

  insert into public.listings
    (seller_id, title, category, brand, size, condition, price, description, image_urls, status)
  values
    (seller, 'Air Jordan 4 Retro "Bred"', 'sneakers', 'Nike', 'UK 9', 'like_new', 24500,
      'OG all, worn twice. Box + extra laces included.', '{}', 'active'),
    (seller, 'Yeezy Boost 350 V2 "Zebra"', 'sneakers', 'adidas', 'UK 8', 'good', 18000,
      'Solid pair, minor creasing. Great daily beater.', '{}', 'active'),
    (seller, 'Supreme Box Logo Hoodie FW22', 'streetwear', 'Supreme', 'M', 'new', 32000,
      'Brand new, deadstock with tags.', '{}', 'active'),
    (seller, 'Pokémon Charizard Holo (PSA 8)', 'collectibles', 'Pokémon', null, 'excellent', 55000,
      'Base set, professionally graded PSA 8.', '{}', 'active'),
    (seller, 'New Balance 550 "White Green"', 'sneakers', 'New Balance', 'UK 10', 'good', 9500,
      'Clean pair, comes with original box.', '{}', 'active');

  raise notice 'Seeded 5 demo listings for %', seller;
end $$;
