-- J7 Commerce Engine — Row Level Security
-- Spec: docs/superpowers/specs/2026-08-23-j7-commerce-engine-design.md §8
--
-- The anon key ships inside every visitor's browser. It is public knowledge.
-- These policies are the ONLY thing separating the public from the data.
--
-- Operator model (spec decision 9): gym owners do NOT log in.
--
-- CORRECTED 2026-08-24. This file used to say "any authenticated user IS the
-- operator" and grant `to authenticated using (true)`. That was wrong and it
-- was exploitable: Supabase ships with PUBLIC SIGNUP ENABLED, so anyone
-- holding the anon key — it is in the page source — could sign themselves up
-- and read every customer name and phone number for every gym at once.
--
-- Being signed in is NOT being trusted. Access now requires a row in
-- public.operators, checked by public.is_operator() (see schema.sql).
--
-- Two things must BOTH be true, and neither alone is enough:
--   1. these policies check is_operator()
--   2. public signup is turned off in the dashboard
--      (Authentication -> Sign In / Providers -> Email -> Allow new users: off)
--
-- If gym-owner logins are ever added, every policy below must gain a tenant
-- scope before the first gym owner is given a password.

alter table public.tenants    enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.coupons    enable row level security;
alter table public.operators  enable row level security;

-- Start clean so this file is safe to re-run.
drop policy if exists operators_self_read       on public.operators;
drop policy if exists operators_operator_all    on public.operators;
drop policy if exists tenants_public_read      on public.tenants;
drop policy if exists tenants_operator_all     on public.tenants;
drop policy if exists categories_public_read   on public.categories;
drop policy if exists categories_operator_all  on public.categories;
drop policy if exists products_public_read     on public.products;
drop policy if exists products_operator_all    on public.products;
drop policy if exists orders_public_insert     on public.orders;
drop policy if exists orders_operator_all      on public.orders;
drop policy if exists coupons_operator_all     on public.coupons;

-- -------------------------------------------------------------- operators
-- An operator can see that they are one. Nobody can read the roster, and
-- nobody can add themselves to it — new operators come from the service role
-- (scripts/operator.mjs) or from an existing operator.
create policy operators_self_read on public.operators
  for select to authenticated
  using (user_id = auth.uid());

create policy operators_operator_all on public.operators
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

-- ---------------------------------------------------------------- tenants
-- Public branding only, and only for live gyms.
create policy tenants_public_read on public.tenants
  for select to anon
  using (active = true);

create policy tenants_operator_all on public.tenants
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

-- ------------------------------------------------------------- categories
create policy categories_public_read on public.categories
  for select to anon
  using (
    active = true
    and exists (select 1 from public.tenants t where t.id = tenant_id and t.active)
  );

create policy categories_operator_all on public.categories
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

-- --------------------------------------------------------------- products
create policy products_public_read on public.products
  for select to anon
  using (
    active = true
    and exists (select 1 from public.tenants t where t.id = tenant_id and t.active)
  );

create policy products_operator_all on public.products
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

-- ----------------------------------------------------------------- orders
-- INSERT ONLY for the public. No select, no update, no delete.
-- A readable orders table would expose every customer name and phone number
-- on the platform, for every gym at once, to anyone who opens devtools.
create policy orders_public_insert on public.orders
  for insert to anon
  with check (
    exists (select 1 from public.tenants t where t.id = tenant_id and t.active)
  );

create policy orders_operator_all on public.orders
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

-- ---------------------------------------------------------------- coupons
-- No anon policy at all. RLS denies by default, so the public cannot read,
-- enumerate, or test coupon codes. Validation happens server-side in the
-- Edge Function. A discount computed in the browser is a discount the
-- customer can edit.
create policy coupons_operator_all on public.coupons
  for all to authenticated
  using (public.is_operator()) with check (public.is_operator());

-- ------------------------------------------------------------------ notes
-- ACCEPTED RISK, Phase 1: an attacker can insert an order with a tampered
-- total, because totals are computed in the browser. This costs nothing today
-- because no money moves online — the gym confirms the price on WhatsApp
-- before anything is handed over, and the frozen `items` snapshot shows the
-- real line prices. When payments are ever added, totals must move server-side
-- BEFORE that happens, not after.
