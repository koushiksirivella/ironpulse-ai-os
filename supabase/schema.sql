-- J7 Commerce Engine — schema
-- Spec: docs/superpowers/specs/2026-08-23-j7-commerce-engine-design.md §7
-- Multi-tenant. Every row belongs to exactly one tenant.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tenants
create table if not exists public.tenants (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  domain           text unique,
  whatsapp_number  text,                      -- E.164, e.g. +919876543210
  enquiry_email    text,                      -- per-tenant, never hardcoded (AUDIT-J7 #1)
  currency         text not null default 'INR',
  address          text,
  hours            text,
  brand            jsonb not null default '{}'::jsonb,   -- CSS custom property values
  logo_url         text,
  sections         jsonb not null default '{}'::jsonb,   -- page sections on/off
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------- categories
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  slug       text not null,
  sort       int  not null default 0,
  active     boolean not null default true,
  unique (tenant_id, slug)
);

-- --------------------------------------------------------------- products
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  kind         text not null check (kind in ('product','membership','pt_package','class')),
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  image_url    text,
  meta         jsonb not null default '{}'::jsonb,  -- duration, sessions, trainer, slots
  stock        int,                                  -- null = not stock-tracked (Phase 2)
  active       boolean not null default true,
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------- orders
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete restrict,
  order_no       text unique,
  customer_name  text not null check (length(trim(customer_name)) > 0),
  phone          text not null check (length(regexp_replace(phone,'\D','','g')) >= 10),
  fulfilment     text not null check (fulfilment in ('pickup_at_gym','delivery')),
  address        text,
  note           text,
  items          jsonb not null,              -- FROZEN SNAPSHOT: name+price+qty at purchase time
  subtotal       numeric(10,2) not null check (subtotal >= 0),
  delivery_fee   numeric(10,2) not null default 0,
  tax            numeric(10,2) not null default 0,
  discount       numeric(10,2) not null default 0,
  total          numeric(10,2) not null check (total >= 0),
  status         text not null default 'new'
                 check (status in ('new','confirmed','delivered','cancelled')),
  channels_sent  jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  -- delivery must carry an address; pickup must not require one
  constraint delivery_needs_address
    check (fulfilment <> 'delivery' or (address is not null and length(trim(address)) > 0)),
  -- items must be a non-empty array
  constraint items_not_empty
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0)
);

-- -------------------------------------------------------------- operators
-- WHY THIS TABLE EXISTS.
--
-- The first version of policies.sql granted full access to the `authenticated`
-- role with `using (true)`. Supabase projects ship with PUBLIC SIGNUP ENABLED,
-- so any stranger holding the anon key — which ships inside every visitor's
-- browser — could create an account, become `authenticated`, and read every
-- customer name and phone number for every gym on the platform. One signup.
--
-- Being signed in is not the same as being trusted. Membership in THIS table
-- is what makes someone an operator. Only an existing operator, or the service
-- role, can add a row.
create table if not exists public.operators (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  email     text,
  added_at  timestamptz not null default now()
);

-- SECURITY DEFINER so the policies below can read this table without needing a
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

-- --------------------------------------------------------------- coupons (Phase 2)
create table if not exists public.coupons (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  code        text not null,
  kind        text not null check (kind in ('percent','flat')),
  value       numeric(10,2) not null check (value > 0),
  max_uses    int,
  used        int not null default 0,
  expires_at  timestamptz,
  active      boolean not null default true,
  unique (tenant_id, code)
);

-- ---------------------------------------------------------------- indexes
create index if not exists products_tenant_active_idx
  on public.products (tenant_id, active, sort);
create index if not exists categories_tenant_idx
  on public.categories (tenant_id, sort);
create index if not exists orders_tenant_created_idx
  on public.orders (tenant_id, created_at desc);
create index if not exists orders_status_idx
  on public.orders (tenant_id, status);
create index if not exists tenants_domain_idx
  on public.tenants (domain) where domain is not null;

-- ------------------------------------------- human-readable order numbers
-- J7-0001, J7-0002 ... per tenant, assigned at insert.
create or replace function public.assign_order_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text;
  next_n int;
begin
  if new.order_no is not null then
    return new;
  end if;
  select upper(slug) into prefix from public.tenants where id = new.tenant_id;
  select coalesce(count(*), 0) + 1 into next_n
    from public.orders where tenant_id = new.tenant_id;
  new.order_no := prefix || '-' || lpad(next_n::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists orders_assign_order_no on public.orders;
create trigger orders_assign_order_no
  before insert on public.orders
  for each row execute function public.assign_order_no();
