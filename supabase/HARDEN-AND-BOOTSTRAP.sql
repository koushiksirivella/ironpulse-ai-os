-- ===========================================================================
--  RUN THIS ONCE, IN THE SUPABASE SQL EDITOR.
--  Needs no personal access token. Safe to re-run.
--
--  WHAT IT FIXES
--  Every policy in the first version said `to authenticated using (true)`, and
--  Supabase ships with public signup ENABLED. That combination meant anybody
--  who read the anon key out of the page source could sign themselves up and
--  then read every customer name and phone number, for every gym, at once.
--
--  Being signed in is not the same as being trusted.
--
--  AFTER RUNNING THIS, DO THE OTHER HALF:
--    Authentication -> Sign In / Providers -> Email -> "Allow new users": OFF
--  Neither half is sufficient alone.
-- ===========================================================================

--  ONE EDIT NEEDED: step 4 below has a placeholder email address. Replace it
--  with the address you signed up with. It is the only line you touch.

begin;

-- ------------------------------------------------------------- 1. operators
create table if not exists public.operators (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  email     text,
  added_at  timestamptz not null default now()
);

-- SECURITY DEFINER so the policies can read this table without needing a
-- policy on `operators` that would itself have to be checked — which recurses.
create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.operators o where o.user_id = auth.uid());
$$;

revoke all on function public.is_operator() from public;
grant execute on function public.is_operator() to anon, authenticated;

-- ------------------------------------------------------ 2. rewrite policies
alter table public.tenants    enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.coupons    enable row level security;
alter table public.operators  enable row level security;

drop policy if exists operators_self_read      on public.operators;
drop policy if exists operators_operator_all   on public.operators;
drop policy if exists tenants_operator_all     on public.tenants;
drop policy if exists categories_operator_all  on public.categories;
drop policy if exists products_operator_all    on public.products;
drop policy if exists orders_operator_all      on public.orders;
drop policy if exists coupons_operator_all     on public.coupons;

create policy operators_self_read on public.operators
  for select to authenticated using (user_id = auth.uid());

create policy operators_operator_all on public.operators
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

create policy tenants_operator_all on public.tenants
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

create policy categories_operator_all on public.categories
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

create policy products_operator_all on public.products
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

create policy orders_operator_all on public.orders
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

create policy coupons_operator_all on public.coupons
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

-- ------------------------------------------------------------- 3. storage
-- Without this, a signed-up stranger has free file hosting in your bucket.
drop policy if exists gym_media_operator_write on storage.objects;

create policy gym_media_operator_write on storage.objects
  for all to authenticated
  using (bucket_id = 'gym-media' and public.is_operator())
  with check (bucket_id = 'gym-media' and public.is_operator());

-- --------------------------------------------------- 4. make YOU an operator
--
--            >>>>>  REPLACE THE EMAIL ON THE NEXT LINE  <<<<<
--
insert into public.operators (user_id, email)
select id, email from auth.users
 where email = 'CHANGE-ME@example.com'
on conflict (user_id) do nothing;

-- ------------------------------------------------- 5. the gym's WhatsApp number
update public.tenants
   set whatsapp_number = '+918125481616'
 where slug = 'j7';

commit;

-- ------------------------------------------------------------------ check
-- Expect: one operator row with your email, and the number set.
-- If operator_count is 0, the email above does not match any account —
-- sign up first with:  npm run operator signup <email>
select
  (select count(*) from public.operators)                             as operator_count,
  (select email from public.operators limit 1)                        as operator_email,
  (select whatsapp_number from public.tenants where slug = 'j7')      as j7_whatsapp;
